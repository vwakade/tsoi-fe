/**
 * Helper for proxying requests from the browser to the custom backend service ("svc").
 *
 * The browser never calls svc directly. It calls this template's own server at
 * /api/svc/... and a handler in server/api/svc/ forwards the request here. svc
 * authenticates by verifying the caller's Sharetribe access token (option A in the
 * svc↔web contract §0), so this helper's job is to pull that token off the request
 * and pass it along as a Bearer header.
 *
 * Keeping the hop server-side means no CORS setup, no connect-src entry in csp.js,
 * and no svc credentials or base URL in the client bundle.
 *
 * NOTE: svc must never be sent a role or permission claim from here or from the
 * client. It re-checks authority on every privileged action and its answer wins
 * (contract §3).
 */
const crypto = require('crypto');
const log = require('../log');
const { createCookieTokenStore } = require('./sdk');

// Server-only. Deliberately NOT prefixed with REACT_APP_, which would inline the
// value into the client bundle.
const SVC_BASE_URL = process.env.SVC_BASE_URL;

// Fail fast rather than letting a request hang: svc is on the critical path for
// SSR (loadData), so a stalled connection would hold the whole page render open.
const SVC_TIMEOUT_MS = parseInt(process.env.SVC_TIMEOUT_MS, 10) || 10000;

// The Sharetribe SDK stores an anonymous token in the same cookie as a logged-in
// one. Only the scope distinguishes them.
const ANONYMOUS_SCOPE = 'public-read';

/**
 * Build an error in svc's response envelope (contract §1).
 *
 * Errors synthesized by this proxy use the same shape as errors from svc itself,
 * so the client has exactly one error contract to parse.
 *
 * NOTE: `NOT_AUTHENTICATED` is not in svc's documented code enum, which has no
 * 401 case. FORBIDDEN is deliberately not reused — the contract reserves it for
 * svc's own authorisation guard, and borrowing it here would misreport "you are
 * logged out" as "you are not allowed". Raise this gap with the svc team.
 *
 * @param {string} code stable error code the client may branch on
 * @param {string} message human-readable; not a stable interface
 * @param {string} requestId correlation id, also sent as x-request-id
 * @returns {Object} error envelope
 */
const errorEnvelope = (code, message, requestId) => ({
  error: { code, message, details: {} },
  requestId,
});

/**
 * Read the caller's Sharetribe access token from the request cookie.
 *
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @returns {string|null} access token, or null if absent or anonymous
 */
const getAccessToken = (req, res) => {
  const token = createCookieTokenStore(req, res).getToken();

  if (!token?.access_token || token.scope === ANONYMOUS_SCOPE) {
    return null;
  }
  return token.access_token;
};
exports.getAccessToken = getAccessToken;

/**
 * Proxy a request to svc and pipe the response back to the browser.
 *
 * The svc response is passed through verbatim — status, body and x-request-id —
 * so a 503 from /health (a valid "degraded" answer, not a failure) and a
 * structured 4xx both reach the client intact.
 *
 * @param {Object} params
 * @param {Object} params.req Express request
 * @param {Object} params.res Express response
 * @param {string} params.path svc path, e.g. '/me/approval-status'
 * @param {string} [params.method] HTTP method, defaults to 'GET'
 * @param {Object} [params.body] JSON body for write methods
 * @param {boolean} [params.requireAuth] Reject anonymous callers, defaults to true
 * @returns {Promise} resolves once the response has been sent
 */
exports.proxyToSvc = ({ req, res, path, method = 'GET', body, requireAuth = true }) => {
  // Correlation id for anything this proxy answers itself. Requests that reach svc
  // are re-stamped below with svc's own id, which is the one worth quoting.
  const localRequestId = crypto.randomUUID();
  const fail = (status, code, message) => {
    res.set('x-request-id', localRequestId);
    return res.status(status).json(errorEnvelope(code, message, localRequestId));
  };

  if (!SVC_BASE_URL) {
    log.error(new Error('SVC_BASE_URL is not configured'), 'svc-not-configured', { path });
    return Promise.resolve(
      fail(503, 'INTERNAL_ERROR', 'Backend service is not configured on this environment.')
    );
  }

  const accessToken = getAccessToken(req, res);

  if (requireAuth && !accessToken) {
    return Promise.resolve(fail(401, 'NOT_AUTHENTICATED', 'Not authenticated.'));
  }

  const url = `${SVC_BASE_URL.replace(/\/$/, '')}${path}`;
  const headers = { Accept: 'application/json' };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(SVC_TIMEOUT_MS),
  })
    .then(svcRes => {
      // svc always sets x-request-id; forward it so it can be quoted in bug reports.
      const requestId = svcRes.headers.get('x-request-id') || localRequestId;
      res.set('x-request-id', requestId);

      // svc may answer with an empty body (e.g. 204). Tolerate that rather than
      // throwing on a JSON parse of ''.
      return svcRes.text().then(text => {
        if (!text) {
          return res.status(svcRes.status).end();
        }
        try {
          return res.status(svcRes.status).json(JSON.parse(text));
        } catch (e) {
          // svc guarantees JSON on every response, including 404s and parser
          // errors. HTML here means we reached something that is not svc.
          log.error(e, 'svc-malformed-response', { path, status: svcRes.status });
          return res
            .status(502)
            .json(
              errorEnvelope(
                'UPSTREAM_FAILED',
                'Backend service returned a malformed response.',
                requestId
              )
            );
        }
      });
    })
    .catch(e => {
      const isTimeout = e.name === 'TimeoutError' || e.name === 'AbortError';
      log.error(e, isTimeout ? 'svc-request-timeout' : 'svc-request-failed', { path, method });
      return fail(
        isTimeout ? 504 : 502,
        'UPSTREAM_FAILED',
        isTimeout ? 'Backend service timed out.' : 'Backend service unavailable.'
      );
    });
};
