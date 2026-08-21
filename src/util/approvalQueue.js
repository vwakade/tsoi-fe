import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { storableError } from './errors';
import { parse } from './urlHelpers';
import { fetchAdminApprovals, approveApplicant, rejectApplicant } from './api';

/**
 * Shared Redux plumbing for the admin approval queues.
 *
 * Teachers and venues are the same queue with a different `role` — svc serves both from
 * `GET /admin/approvals?role=teacher|venue` and the approve/reject endpoints are keyed
 * by `userId` regardless of role. So the slice, the thunks and `loadData` are built once
 * here and each page supplies its name and role.
 *
 * Scope note: svc provides list / approve / reject only. There is no suspend and no
 * reinstate, so approve and reject are both terminal.
 */

// UI-only filter values. 'all' means "send no status filter upstream".
export const FILTER_VALUES = ['all', 'pending', 'approved', 'rejected'];

/**
 * Apply a terminal decision to a row in place.
 *
 * Approve and reject are both irreversible, so the new state is taken from svc's
 * response rather than assumed on click — an optimistic update that later failed would
 * be actively misleading here.
 */
const applyDecision = (state, userId, response, fallbackState) => {
  const nextState = response?.approvalState || fallbackState;
  state.applicants = state.applicants.map(a =>
    a.id === userId ? { ...a, approvalState: nextState } : a
  );
};

/**
 * Build the slice, thunks and loadData for one approval queue.
 *
 * @param {Object} options
 * @param {string} options.name page name, used for the action type prefix, e.g. 'AdminTeachersPage'
 * @param {string} options.role svc role: 'teacher' or 'venue'
 * @returns {Object} { reducer, queryApprovals, approve, reject, clearDecisionError, loadData }
 */
export const createApprovalQueue = options => {
  const { name, role } = options;

  const queryApprovalsThunk = createAsyncThunk(
    `app/${name}/queryApprovals`,
    (queryParams, { rejectWithValue }) =>
      fetchAdminApprovals({ role, ...queryParams }).catch(e => rejectWithValue(storableError(e)))
  );

  const approveThunk = createAsyncThunk(`app/${name}/approve`, (userId, { rejectWithValue }) =>
    approveApplicant(userId)
      .then(response => ({ userId, response }))
      .catch(e => rejectWithValue(storableError(e)))
  );

  const rejectThunk = createAsyncThunk(
    `app/${name}/reject`,
    ({ userId, reason }, { rejectWithValue }) =>
      rejectApplicant(userId, reason)
        .then(response => ({ userId, response }))
        .catch(e => rejectWithValue(storableError(e)))
  );

  const slice = createSlice({
    name,
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

  const queryApprovals = queryParams => dispatch =>
    dispatch(queryApprovalsThunk(queryParams)).unwrap();

  const approve = userId => dispatch => dispatch(approveThunk(userId)).unwrap();

  const reject = (userId, reason) => dispatch => dispatch(rejectThunk({ userId, reason })).unwrap();

  /**
   * The status filter lives in the URL so it survives a refresh, is linkable, and is
   * readable here for SSR.
   *
   * `fetchCurrentUser` is dispatched by the caller, not here, so this stays free of a
   * dependency on the user duck.
   */
  const loadData = (params, search) => dispatch => {
    const { status = 'all', page } = parse(search);
    const validStatus = FILTER_VALUES.includes(status) ? status : 'all';
    return dispatch(queryApprovals({ status: validStatus, page }));
  };

  return {
    reducer: slice.reducer,
    clearDecisionError: slice.actions.clearDecisionError,
    queryApprovals,
    approve,
    reject,
    loadData,
  };
};
