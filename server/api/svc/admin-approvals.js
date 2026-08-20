/**
 * Admin approval queue, proxied to svc.
 *
 * svc owns the whole approval surface: it holds the Integration API credential and
 * re-checks that the caller is an operator. This file forwards identity and nothing
 * more — never a role claim (contract §3).
 *
 * Scope note: svc provides list / approve / reject only. There is no suspend or
 * reinstate; `approvalState` has three values.
 */
const { proxyToSvc } = require('../../api-util/svc');

const VALID_ROLES = ['teacher', 'venue'];

/** GET /api/svc/admin/approvals?role=teacher|venue&status=&page= */
exports.list = (req, res) => {
  const { role, status, page } = req.query || {};

  // Fail here rather than forwarding a role svc does not serve, so a typo reads as
  // a clear 400 instead of an opaque NOT_FOUND (which svc also returns for unknown
  // routes — see contract §3).
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_FAILED',
        message: `role must be one of: ${VALID_ROLES.join(', ')}`,
        details: {},
      },
      requestId: null,
    });
  }

  const query = new URLSearchParams({ role });
  // 'all' is a UI-only concept; omit the param rather than sending it upstream.
  if (status && status !== 'all') {
    query.set('status', status);
  }
  if (page) {
    query.set('page', String(page));
  }

  return proxyToSvc({ req, res, path: `/admin/approvals?${query.toString()}`, method: 'GET' });
};

/** POST /api/svc/admin/approvals/:userId/approve */
exports.approve = (req, res) =>
  proxyToSvc({
    req,
    res,
    path: `/admin/approvals/${encodeURIComponent(req.params.userId)}/approve`,
    method: 'POST',
    body: {},
  });

/**
 * POST /api/svc/admin/approvals/:userId/reject
 *
 * A rejection reason is forwarded when present. Whether svc stores it is not yet
 * confirmed — if it does not, drop the textarea from the UI rather than collecting
 * text that goes nowhere.
 */
exports.reject = (req, res) => {
  const { reason } = req.body || {};
  return proxyToSvc({
    req,
    res,
    path: `/admin/approvals/${encodeURIComponent(req.params.userId)}/reject`,
    method: 'POST',
    body: reason ? { reason } : {},
  });
};
