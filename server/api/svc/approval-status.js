/**
 * Return the current user's approval status.
 *
 * Approval state lives in operator-only data on svc, so the user's own Sharetribe
 * session cannot read it from their profile. This endpoint is the only source —
 * do not try to derive approval status from publicData.
 *
 * Approval gates publishing, not creating: a pending teacher can build drafts but
 * cannot publish them.
 */
const { proxyToSvc } = require('../../api-util/svc');

module.exports = (req, res) => proxyToSvc({ req, res, path: '/me/approval-status', method: 'GET' });
