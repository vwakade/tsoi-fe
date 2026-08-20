import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { storableError } from '../../util/errors';
import { fetchApprovalStatus } from '../../util/api';
import { fetchCurrentUser } from '../../ducks/user.duck';

// ================ Async Thunks ================ //

const queryApprovalStatusPayloadCreator = (_, { rejectWithValue }) => {
  return fetchApprovalStatus().catch(e => rejectWithValue(storableError(e)));
};

export const queryApprovalStatusThunk = createAsyncThunk(
  'app/VenueDashboardPage/queryApprovalStatus',
  queryApprovalStatusPayloadCreator
);

export const queryApprovalStatus = () => dispatch => dispatch(queryApprovalStatusThunk()).unwrap();

// ================ Slice ================ //

const teacherDashboardPageSlice = createSlice({
  name: 'VenueDashboardPage',
  initialState: {
    approvalState: null,
    approvalInProgress: false,
    approvalError: null,
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
  },
});

export default teacherDashboardPageSlice.reducer;

// ================ loadData ================ //

export const loadData = () => dispatch => {
  return Promise.all([
    dispatch(fetchCurrentUser()),
    // Swallow the rejection: approval status is one section of the page, and svc is a
    // second network dependency that can fail independently of Sharetribe. The banner
    // renders its own error rather than failing the whole page.
    dispatch(queryApprovalStatus()).catch(() => null),
  ]);
};
