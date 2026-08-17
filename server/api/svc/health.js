/**
 * Proxy svc's health check.
 *
 * Public on purpose: this is the one svc endpoint that is LIVE and callable before
 * the auth decision in the svc↔web contract §0 lands, so it is how the proxy wiring
 * gets verified end to end.
 *
 * A 503 here means "degraded" and is a valid answer, not a failure — the body still
 * carries { status, checks: { database, sharetribe }, timestamp }.
 */
const { proxyToSvc } = require('../../api-util/svc');

module.exports = (req, res) =>
  proxyToSvc({ req, res, path: '/health', method: 'GET', requireAuth: false });
