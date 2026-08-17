// These helpers are calling this template's own server-side routes
// so, they are not directly calling Marketplace API or Integration API.
// You can find these api endpoints from 'server/api/...' directory

import appSettings from '../config/settings';
import { types as sdkTypes, transit } from './sdkLoader';
import Decimal from 'decimal.js';

export const apiBaseUrl = marketplaceRootURL => {
  const port = process.env.REACT_APP_DEV_API_SERVER_PORT;
  const useDevApiServer = process.env.NODE_ENV === 'development' && !!port;

  // In development, the dev API server is running in a different port
  if (useDevApiServer) {
    return `http://localhost:${port}`;
  }

  // Otherwise, use the given marketplaceRootURL parameter or the same domain and port as the frontend
  return marketplaceRootURL ? marketplaceRootURL.replace(/\/$/, '') : `${window.location.origin}`;
};

// Application type handlers for JS SDK.
//
// NOTE: keep in sync with `typeHandlers` in `server/api-util/sdk.js`
export const typeHandlers = [
  // Use Decimal type instead of SDK's BigDecimal.
  {
    type: sdkTypes.BigDecimal,
    customType: Decimal,
    writer: v => new sdkTypes.BigDecimal(v.toString()),
    reader: v => new Decimal(v.value),
  },
];

const serialize = data => {
  return transit.write(data, { typeHandlers, verbose: appSettings.sdk.transitVerbose });
};

const deserialize = str => {
  return transit.read(str, { typeHandlers });
};

const methods = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

// If server/api returns data from SDK, you should set Content-Type to 'application/transit+json'
const request = (path, options = {}) => {
  const url = `${apiBaseUrl()}${path}`;
  const { credentials, headers, body, ...rest } = options;

  // If headers are not set, we assume that the body should be serialized as transit format.
  const shouldSerializeBody =
    (!headers || headers['Content-Type'] === 'application/transit+json') && body;
  const bodyMaybe = shouldSerializeBody ? { body: serialize(body) } : {};

  const fetchOptions = {
    credentials: credentials || 'include',
    // Since server/api mostly talks to Marketplace API using SDK,
    // we default to 'application/transit+json' as content type (as SDK uses transit).
    headers: headers || { 'Content-Type': 'application/transit+json' },
    ...bodyMaybe,
    ...rest,
  };

  return window.fetch(url, fetchOptions).then(res => {
    const contentTypeHeader = res.headers.get('Content-Type');
    const contentType = contentTypeHeader ? contentTypeHeader.split(';')[0] : null;

    if (res.status >= 400) {
      return res.json().then(data => {
        let e = new Error();
        e = Object.assign(e, data);

        throw e;
      });
    }
    if (contentType === 'application/transit+json') {
      return res.text().then(deserialize);
    } else if (contentType === 'application/json') {
      return res.json();
    }
    return res.text();
  });
};

// Keep the previous parameter order for the post method.
// For now, only POST has own specific function, but you can create more or use request directly.
const post = (path, body, options = {}) => {
  const requestOptions = {
    ...options,
    method: methods.POST,
    body,
  };

  return request(path, requestOptions);
};

// The svc endpoints exchange plain JSON, not transit. Setting the header explicitly
// keeps `request` from serializing bodies as transit for these calls.
const JSON_HEADERS = { 'Content-Type': 'application/json' };

const getJson = (path, options = {}) =>
  request(path, { ...options, method: methods.GET, headers: JSON_HEADERS });

// ================ Custom backend service (svc) ================ //
//
// These are proxied through this app's own server (server/api/svc/*), which
// forwards them to svc with the caller's Sharetribe access token. The browser
// never talks to svc directly, so there is no CORS or CSP handling here.

// Errors from svc use a stable envelope: { error: { code, message, details }, requestId }.
// Branch on `error.code`, never on `error.message` — the message is not an interface.
// The proxy in server/api-util/svc.js synthesizes its own failures in the same shape.

// Fetch svc's health. This is the only svc endpoint that is LIVE today, so it is
// what verifies the proxy wiring end to end.
//
// A 503 means "degraded", which is a valid answer rather than a failure — the body
// still carries { status, checks, timestamp }. `request` rejects on any status >= 400,
// so unwrap that case back into a normal result.
//
// See `server/api/svc/health.js`.
export const fetchSvcHealth = () => {
  return getJson('/api/svc/health').catch(e => {
    const isDegradedReport = e?.status && e?.checks;
    if (isDegradedReport) {
      return { status: e.status, checks: e.checks, timestamp: e.timestamp };
    }
    throw e;
  });
};

// Fetch the current user's approval status.
//
// Approval state lives in Sharetribe metadata, which is operator-only, so the user's
// own session cannot read it — this endpoint is the only source. Do not try to derive
// it from the profile.
//
// Returns { approvalState: 'pending' | 'approved' | 'rejected' }. Note the values are
// lowercase on the wire; capitalized labels belong to the UI layer only.
//
// Approval gates publishing, not creating: a pending teacher can build drafts but
// cannot publish them.
//
// NOTE: PLANNED in the svc contract, not yet LIVE. svc answers NOT_FOUND until it
// ships — and per contract §3 a NOT_FOUND never by itself means "not built yet".
//
// See `server/api/svc/approval-status.js`.
export const fetchApprovalStatus = () => {
  return getJson('/api/svc/approval-status');
};

// ================ This app's own server ================ //

// Fetch transaction line items from the local API endpoint.
//
// See `server/api/transaction-line-items.js` to see what data should
// be sent in the body.
export const transactionLineItems = body => {
  return post('/api/transaction-line-items', body);
};

// Initiate a privileged transaction.
//
// With privileged transitions, the transactions need to be created
// from the backend. This endpoint enables sending the order data to
// the local backend, and passing that to the Marketplace API.
//
// See `server/api/initiate-privileged.js` to see what data should be
// sent in the body.
export const initiatePrivileged = body => {
  return post('/api/initiate-privileged', body);
};

// Transition a transaction with a privileged transition.
//
// This is similar to the `initiatePrivileged` above. It will use the
// backend for the transition. The backend endpoint will add the
// payment line items to the transition params.
//
// See `server/api/transition-privileged.js` to see what data should
// be sent in the body.
export const transitionPrivileged = body => {
  return post('/api/transition-privileged', body);
};

// Create user with identity provider (e.g. Facebook or Google)
//
// If loginWithIdp api call fails and user can't authenticate to Marketplace API with idp
// we will show option to create a new user with idp.
// For that user needs to confirm data fetched from the idp.
// After the confirmation, this endpoint is called to create a new user with confirmed data.
//
// See `server/api/auth/createUserWithIdp.js` to see what data should
// be sent in the body.
export const createUserWithIdp = body => {
  return post('/api/auth/create-user-with-idp', body);
};

// Check if user can be deleted and then delete the user. Endpoint logic
// must be modified to accommodate the transaction processes used in
// the marketplace.
export const deleteUserAccount = body => {
  return post('/api/delete-account', body);
};
