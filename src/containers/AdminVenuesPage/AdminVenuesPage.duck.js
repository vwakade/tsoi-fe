import { createApprovalQueue, FILTER_VALUES } from '../../util/approvalQueue';
import { fetchCurrentUser } from '../../ducks/user.duck';

// Same queue as the teachers one with a different svc role — see util/approvalQueue.js.
const queue = createApprovalQueue({ name: 'AdminVenuesPage', role: 'venue' });

export { FILTER_VALUES };

export const { queryApprovals, approve, reject, clearDecisionError } = queue;

export default queue.reducer;

// ================ loadData ================ //

export const loadData = (params, search) => dispatch =>
  Promise.all([
    dispatch(fetchCurrentUser()),
    // Swallow the rejection: the page renders its own error state, and a throwing
    // loadData would surface as a generic page-level failure instead.
    dispatch(queue.loadData(params, search)).catch(() => null),
  ]);
