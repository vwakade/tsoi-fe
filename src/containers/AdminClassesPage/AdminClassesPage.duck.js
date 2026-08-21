import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';
import { denormalisedResponseEntities } from '../../util/data';
import { fetchCurrentUser } from '../../ducks/user.duck';

/**
 * Admin view of classes on the platform.
 *
 * Unlike the other three rail entries this one has a real data source: a listings query
 * for the events type. What it can and cannot show:
 *
 * - **Class**, **Teacher**, **Status** — from the listing and its author. ✓
 * - **Seats** — `currentStock` is seats *remaining*. The design shows seats *sold*
 *   (`8 / 12`), which needs transactions and so is not available.
 * - **Venue** and **Date** — no confirmed listing field carries the venue, and the class
 *   date lives in availability rather than on the listing. Both columns are omitted
 *   rather than shown empty.
 *
 * Only **published** listings come back from a listings query, so the design's
 * Completed and Cancelled filters have nothing to select — the status column is here for
 * when that changes, not as a working filter.
 */

const EVENTS_LISTING_TYPE = 'events';

export const RESULT_PAGE_SIZE = 24;

const queryClassesPayloadCreator = (queryParams, { extra: sdk, rejectWithValue }) =>
  sdk.listings
    .query({
      pub_listingType: EVENTS_LISTING_TYPE,
      page: queryParams?.page || 1,
      perPage: RESULT_PAGE_SIZE,
      // 'author' gives the teacher name; 'currentStock' gives seats remaining. Both are
      // relationships, so omitting them leaves those columns permanently blank.
      include: ['author', 'currentStock'],
      'fields.user': ['profile.displayName'],
    })
    .then(response => ({
      listings: denormalisedResponseEntities(response),
      pagination: response?.data?.meta || null,
    }))
    .catch(e => rejectWithValue(storableError(e)));

export const queryClassesThunk = createAsyncThunk(
  'app/AdminClassesPage/queryClasses',
  queryClassesPayloadCreator
);

const adminClassesPageSlice = createSlice({
  name: 'AdminClassesPage',
  initialState: {
    queryInProgress: false,
    queryError: null,
    listings: [],
    pagination: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(queryClassesThunk.pending, state => {
        state.queryInProgress = true;
        state.queryError = null;
        state.listings = [];
      })
      .addCase(queryClassesThunk.fulfilled, (state, action) => {
        state.listings = action.payload.listings;
        state.pagination = action.payload.pagination;
        state.queryInProgress = false;
      })
      .addCase(queryClassesThunk.rejected, (state, action) => {
        console.error(action.payload || action.error);
        state.queryInProgress = false;
        state.queryError = action.payload;
      });
  },
});

export default adminClassesPageSlice.reducer;

// ================ loadData ================ //

export const loadData = (params, search) => dispatch => {
  const { page } = parse(search);

  return Promise.all([
    dispatch(fetchCurrentUser()),
    dispatch(queryClassesThunk({ page })).catch(() => null),
  ]);
};
