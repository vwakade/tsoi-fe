import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { storableError } from '../../util/errors';
import { fetchApprovalStatus } from '../../util/api';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { transitions } from '../../transactions/transactionProcessBooking';

// A booking is "completed" once the class has run. Anything from delivery onwards
// counts, including the review transitions that follow it.
const COMPLETED_TRANSITIONS = [
  transitions.COMPLETE,
  transitions.OPERATOR_COMPLETE,
  transitions.REVIEW_1_BY_CUSTOMER,
  transitions.REVIEW_1_BY_PROVIDER,
  transitions.REVIEW_2_BY_CUSTOMER,
  transitions.REVIEW_2_BY_PROVIDER,
  transitions.EXPIRE_REVIEW_PERIOD,
  transitions.EXPIRE_CUSTOMER_REVIEW_PERIOD,
  transitions.EXPIRE_PROVIDER_REVIEW_PERIOD,
].filter(Boolean);

// Accepted but not yet run.
const UPCOMING_TRANSITIONS = [transitions.ACCEPT, transitions.OPERATOR_ACCEPT].filter(Boolean);

/**
 * Count-only query.
 *
 * Reads `meta.totalItems`, which is the true total and is unaffected by `perPage` —
 * unlike summing values across pages, which silently caps. So counts are safe to derive
 * client-side; money totals are not, which is why there is no earnings figure here.
 */
const countOnly = (queryFn, params) =>
  queryFn({ ...params, perPage: 1 }).then(response => response?.data?.meta?.totalItems ?? 0);

// ================ Async Thunks ================ //

const queryApprovalStatusPayloadCreator = (_, { rejectWithValue }) => {
  return fetchApprovalStatus().catch(e => rejectWithValue(storableError(e)));
};

export const queryApprovalStatusThunk = createAsyncThunk(
  'app/TeacherDashboardPage/queryApprovalStatus',
  queryApprovalStatusPayloadCreator
);

export const queryApprovalStatus = () => dispatch => dispatch(queryApprovalStatusThunk()).unwrap();

const queryStatsPayloadCreator = (_, { extra: sdk, rejectWithValue }) => {
  return Promise.all([
    countOnly(params => sdk.transactions.query(params), {
      only: 'sale',
      lastTransitions: COMPLETED_TRANSITIONS,
    }),
    countOnly(params => sdk.transactions.query(params), {
      only: 'sale',
      lastTransitions: UPCOMING_TRANSITIONS,
    }),
    countOnly(params => sdk.ownListings.query(params), { states: ['published'] }),
  ])
    .then(([classesCompleted, upcomingBookings, publishedListings]) => ({
      classesCompleted,
      upcomingBookings,
      publishedListings,
    }))
    .catch(e => rejectWithValue(storableError(e)));
};

export const queryStatsThunk = createAsyncThunk(
  'app/TeacherDashboardPage/queryStats',
  queryStatsPayloadCreator
);

export const queryStats = () => dispatch => dispatch(queryStatsThunk()).unwrap();

// ================ Slice ================ //

const teacherDashboardPageSlice = createSlice({
  name: 'TeacherDashboardPage',
  initialState: {
    approvalState: null,
    approvalInProgress: false,
    approvalError: null,
    stats: null,
    statsInProgress: false,
    statsError: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(queryApprovalStatusThunk.pending, state => {
        state.approvalInProgress = true;
        state.approvalError = null;
      })
      .addCase(queryApprovalStatusThunk.fulfilled, (state, action) => {
        state.approvalState = action.payload?.approvalState || null;
        state.approvalInProgress = false;
      })
      .addCase(queryApprovalStatusThunk.rejected, (state, action) => {
        console.error(action.payload || action.error);
        state.approvalInProgress = false;
        state.approvalError = action.payload;
      });

    builder
      .addCase(queryStatsThunk.pending, state => {
        state.statsInProgress = true;
        state.statsError = null;
      })
      .addCase(queryStatsThunk.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.statsInProgress = false;
      })
      .addCase(queryStatsThunk.rejected, (state, action) => {
        console.error(action.payload || action.error);
        state.statsInProgress = false;
        state.statsError = action.payload;
      });
  },
});

export default teacherDashboardPageSlice.reducer;

// ================ loadData ================ //

export const loadData = () => dispatch => {
  // Sharetribe and svc are separate dependencies that can fail independently, so each
  // section renders its own state rather than one failure taking down the page.
  return Promise.all([
    dispatch(fetchCurrentUser()),
    dispatch(queryStats()).catch(() => null),
    dispatch(queryApprovalStatus()).catch(() => null),
  ]);
};
