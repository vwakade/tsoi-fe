import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { storableError } from '../../util/errors';
import { fetchAdminApprovals } from '../../util/api';
import { fetchCurrentUser } from '../../ducks/user.duck';

/**
 * Admin overview data.
 *
 * Three of the design's six figures have a real source; three do not, and this duck
 * deliberately does not invent them:
 *
 * | Figure                | Source                                        |
 * |-----------------------|-----------------------------------------------|
 * | Teachers (approved)   | svc `GET /admin/approvals?role=teacher`       |
 * | Venues (approved)     | svc `GET /admin/approvals?role=venue`         |
 * | Active classes        | Marketplace API listings query                |
 * | Bookings              | none — see below                              |
 * | Gross revenue         | none                                          |
 * | Commission            | none                                          |
 *
 * `sdk.transactions.query()` returns only the **calling user's** transactions, so an
 * operator cannot read platform-wide bookings or revenue through the Marketplace API at
 * all. Those three, and the design's "Recent bookings" table, need svc rollups that are
 * not in its committed scope. The page renders them as explicitly unavailable.
 */

// The live Console listing type id for a class. Note the plural.
const EVENTS_LISTING_TYPE = 'events';

/**
 * Pull a total out of an approvals response.
 *
 * The contract does not pin the list shape, so tolerate both a paginated envelope and a
 * bare array. A bare array can only report what one page held, so it is reported as
 * capped rather than as a true total — an admin overview that quietly understates the
 * platform is worse than one that says it does not know.
 *
 * @param {Object|Array} payload
 * @returns {{count: number, isCapped: boolean}}
 */
const readTotal = payload => {
  if (Array.isArray(payload)) {
    return { count: payload.length, isCapped: true };
  }
  const total = payload?.meta?.totalItems;
  if (typeof total === 'number') {
    return { count: total, isCapped: false };
  }
  const data = payload?.data || [];
  return { count: data.length, isCapped: true };
};

const readItems = payload => (Array.isArray(payload) ? payload : payload?.data || []);

// ================ Async Thunks ================ //

/**
 * Four svc calls, tolerant of individual failure.
 *
 * `allSettled` rather than `all`: svc is a second network dependency and only /health is
 * live today, so one failing call must not blank the whole page. Each panel reports its
 * own absence.
 */
const queryApprovalsPayloadCreator = () =>
  Promise.allSettled([
    fetchAdminApprovals({ role: 'teacher', status: 'pending' }),
    fetchAdminApprovals({ role: 'venue', status: 'pending' }),
    fetchAdminApprovals({ role: 'teacher', status: 'approved' }),
    fetchAdminApprovals({ role: 'venue', status: 'approved' }),
  ]).then(([pendingTeachers, pendingVenues, approvedTeachers, approvedVenues]) => ({
    pendingTeachers:
      pendingTeachers.status === 'fulfilled' ? readItems(pendingTeachers.value) : null,
    pendingVenues: pendingVenues.status === 'fulfilled' ? readItems(pendingVenues.value) : null,
    teacherCount:
      approvedTeachers.status === 'fulfilled' ? readTotal(approvedTeachers.value) : null,
    venueCount: approvedVenues.status === 'fulfilled' ? readTotal(approvedVenues.value) : null,
  }));

export const queryApprovalsThunk = createAsyncThunk(
  'app/AdminOverviewPage/queryApprovals',
  queryApprovalsPayloadCreator
);

/**
 * Active classes: published listings of the events type.
 *
 * `perPage: 1` because only `meta.totalItems` is wanted — the listings themselves are
 * not rendered here. A listings query returns published listings only, which is exactly
 * what "active" means on this card.
 */
const queryActiveClassesPayloadCreator = (_, { extra: sdk, rejectWithValue }) =>
  sdk.listings
    .query({ pub_listingType: EVENTS_LISTING_TYPE, perPage: 1 })
    .then(response => response?.data?.meta?.totalItems ?? null)
    .catch(e => rejectWithValue(storableError(e)));

export const queryActiveClassesThunk = createAsyncThunk(
  'app/AdminOverviewPage/queryActiveClasses',
  queryActiveClassesPayloadCreator
);

// ================ Slice ================ //

const adminOverviewPageSlice = createSlice({
  name: 'AdminOverviewPage',
  initialState: {
    approvalsInProgress: false,
    // True only when every svc call failed — a partial result still renders.
    approvalsFailed: false,
    pendingTeachers: null,
    pendingVenues: null,
    teacherCount: null,
    venueCount: null,

    activeClassesInProgress: false,
    activeClassesError: null,
    activeClasses: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(queryApprovalsThunk.pending, state => {
        state.approvalsInProgress = true;
        state.approvalsFailed = false;
      })
      .addCase(queryApprovalsThunk.fulfilled, (state, action) => {
        const { pendingTeachers, pendingVenues, teacherCount, venueCount } = action.payload;
        state.pendingTeachers = pendingTeachers;
        state.pendingVenues = pendingVenues;
        state.teacherCount = teacherCount;
        state.venueCount = venueCount;
        state.approvalsInProgress = false;
        state.approvalsFailed =
          pendingTeachers === null &&
          pendingVenues === null &&
          teacherCount === null &&
          venueCount === null;
      })
      .addCase(queryApprovalsThunk.rejected, (state, action) => {
        console.error(action.payload || action.error);
        state.approvalsInProgress = false;
        state.approvalsFailed = true;
      });

    builder
      .addCase(queryActiveClassesThunk.pending, state => {
        state.activeClassesInProgress = true;
        state.activeClassesError = null;
      })
      .addCase(queryActiveClassesThunk.fulfilled, (state, action) => {
        state.activeClasses = action.payload;
        state.activeClassesInProgress = false;
      })
      .addCase(queryActiveClassesThunk.rejected, (state, action) => {
        console.error(action.payload || action.error);
        state.activeClassesInProgress = false;
        state.activeClassesError = action.payload;
      });
  },
});

export default adminOverviewPageSlice.reducer;

// ================ loadData ================ //

export const loadData = () => dispatch =>
  Promise.all([
    dispatch(fetchCurrentUser()),
    // Both swallow their rejection: the page renders per-section absence, and a throwing
    // loadData would replace the whole page with a generic failure.
    dispatch(queryApprovalsThunk()).catch(() => null),
    dispatch(queryActiveClassesThunk()).catch(() => null),
  ]);
