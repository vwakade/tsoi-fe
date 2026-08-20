import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';
import { fetchAdminApprovals, approveApplicant, rejectApplicant } from '../../util/api';
import { fetchCurrentUser } from '../../ducks/user.duck';

const ROLE = 'teacher';

// UI-only filter values. 'all' means "send no status filter upstream".
export const FILTER_VALUES = ['all', 'pending', 'approved', 'rejected'];

// ================ Async Thunks ================ //

const queryApprovalsPayloadCreator = (queryParams, { rejectWithValue }) => {
  return fetchAdminApprovals({ role: ROLE, ...queryParams }).catch(e =>
    rejectWithValue(storableError(e))
  );
};

export const queryApprovalsThunk = createAsyncThunk(
  'app/AdminTeachersPage/queryApprovals',
  queryApprovalsPayloadCreator
);

export const queryApprovals = queryParams => dispatch =>
  dispatch(queryApprovalsThunk(queryParams)).unwrap();

const approvePayloadCreator = (userId, { rejectWithValue }) => {
  return approveApplicant(userId)
    .then(response => ({ userId, response }))
    .catch(e => rejectWithValue(storableError(e)));
};

export const approveThunk = createAsyncThunk(
  'app/AdminTeachersPage/approve',
  approvePayloadCreator
);

export const approve = userId => dispatch => dispatch(approveThunk(userId)).unwrap();

const rejectPayloadCreator = ({ userId, reason }, { rejectWithValue }) => {
  return rejectApplicant(userId, reason)
    .then(response => ({ userId, response }))
    .catch(e => rejectWithValue(storableError(e)));
};

export const rejectThunk = createAsyncThunk('app/AdminTeachersPage/reject', rejectPayloadCreator);

export const reject = (userId, reason) => dispatch =>
  dispatch(rejectThunk({ userId, reason })).unwrap();

// ================ Slice ================ //

/**
 * Apply a terminal decision to a row in place.
 *
 * Approve and reject are both irreversible, so the state is taken from svc's response
 * rather than assumed on click — an optimistic update that later failed would be
 * actively misleading here.
 */
const applyDecision = (state, userId, response, fallbackState) => {
  const nextState = response?.approvalState || fallbackState;
  state.applicants = state.applicants.map(a =>
    a.id === userId ? { ...a, approvalState: nextState } : a
  );
};

const adminTeachersPageSlice = createSlice({
  name: 'AdminTeachersPage',
  initialState: {
    queryInProgress: false,
    queryError: null,
    applicants: [],
    pagination: null,
    // userId of the row with a decision in flight, so only that row's buttons disable
    decisionInProgressId: null,
    decisionError: null,
  },
  reducers: {
    clearDecisionError: state => {
      state.decisionError = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(queryApprovalsThunk.pending, state => {
        state.queryInProgress = true;
        state.queryError = null;
        state.applicants = [];
      })
      .addCase(queryApprovalsThunk.fulfilled, (state, action) => {
        const payload = action.payload || {};
        // Tolerate either a bare array or a paginated envelope — the contract does not
        // pin the list shape, and svc has not shipped this endpoint yet.
        state.applicants = Array.isArray(payload) ? payload : payload.data || [];
        state.pagination = Array.isArray(payload) ? null : payload.meta || null;
        state.queryInProgress = false;
      })
      .addCase(queryApprovalsThunk.rejected, (state, action) => {
        console.error(action.payload || action.error);
        state.queryInProgress = false;
        state.queryError = action.payload;
      });

    builder
      .addCase(approveThunk.pending, (state, action) => {
        state.decisionInProgressId = action.meta.arg;
        state.decisionError = null;
      })
      .addCase(approveThunk.fulfilled, (state, action) => {
        const { userId, response } = action.payload;
        applyDecision(state, userId, response, 'approved');
        state.decisionInProgressId = null;
      })
      .addCase(approveThunk.rejected, (state, action) => {
        console.error(action.payload || action.error);
        state.decisionInProgressId = null;
        state.decisionError = action.payload;
      });

    builder
      .addCase(rejectThunk.pending, (state, action) => {
        state.decisionInProgressId = action.meta.arg?.userId;
        state.decisionError = null;
      })
      .addCase(rejectThunk.fulfilled, (state, action) => {
        const { userId, response } = action.payload;
        applyDecision(state, userId, response, 'rejected');
        state.decisionInProgressId = null;
      })
      .addCase(rejectThunk.rejected, (state, action) => {
        console.error(action.payload || action.error);
        state.decisionInProgressId = null;
        state.decisionError = action.payload;
      });
  },
});

export const { clearDecisionError } = adminTeachersPageSlice.actions;

export default adminTeachersPageSlice.reducer;

// ================ loadData ================ //

export const loadData = (params, search) => dispatch => {
  const { status = 'all', page } = parse(search);
  const validStatus = FILTER_VALUES.includes(status) ? status : 'all';

  return Promise.all([
    dispatch(fetchCurrentUser()),
    // Swallow the rejection: the page renders its own error state, and a throwing
    // loadData would surface as a generic page-level failure instead.
    dispatch(queryApprovals({ status: validStatus, page })).catch(() => null),
  ]);
};
