/**
 * This file contains server side endpoints that can be used to perform backend
 * tasks that can not be handled in the browser.
 *
 * The endpoints should not clash with the application routes. Therefore, the
 * endpoints are prefixed in the main server where this file is used.
 */

const express = require('express');
const bodyParser = require('body-parser');
const { deserialize } = require('./api-util/sdk');

const initiateLoginAs = require('./api/initiate-login-as');
const loginAs = require('./api/login-as');
const transactionLineItems = require('./api/transaction-line-items');
const initiatePrivileged = require('./api/initiate-privileged');
const transitionPrivileged = require('./api/transition-privileged');
const deleteAccount = require('./api/delete-account');

// Custom backend service ("svc") proxy endpoints. See server/api-util/svc.js.
const svcHealth = require('./api/svc/health');
const svcApprovalStatus = require('./api/svc/approval-status');
const svcAdminApprovals = require('./api/svc/admin-approvals');

const createUserWithIdp = require('./api/auth/createUserWithIdp');

const { authenticateFacebook, authenticateFacebookCallback } = require('./api/auth/facebook');
const { authenticateGoogle, authenticateGoogleCallback } = require('./api/auth/google');

const router = express.Router();

// ================ API router middleware: ================ //

// Parse Transit body first to a string
router.use(
  bodyParser.text({
    type: 'application/transit+json',
  })
);

// Parse plain JSON bodies, used by the svc proxy endpoints.
// Needed here rather than relying on server/index.js, where the JSON parser is only
// mounted when CSP is enabled — and the dev apiServer.js mounts none at all. Without
// this, req.body is undefined for JSON POSTs in development.
// Only engages for Content-Type: application/json, so the Transit path above is untouched.
router.use(bodyParser.json());

// Deserialize Transit body string to JS data
router.use((req, res, next) => {
  if (req.get('Content-Type') === 'application/transit+json' && typeof req.body === 'string') {
    try {
      req.body = deserialize(req.body);
    } catch (e) {
      console.error('Failed to parse request body as Transit:');
      console.error(e);
      res.status(400).send('Invalid Transit in request body.');
      return;
    }
  }
  next();
});

// ================ API router endpoints: ================ //

router.get('/initiate-login-as', initiateLoginAs);
router.get('/login-as', loginAs);
router.post('/transaction-line-items', transactionLineItems);
router.post('/initiate-privileged', initiatePrivileged);
router.post('/transition-privileged', transitionPrivileged);
router.post('/delete-account', deleteAccount);

// ================ Custom backend service (svc): ================ //

// LIVE in the svc contract.
router.get('/svc/health', svcHealth);

// PLANNED in the svc contract (Domain 8, Sprint S1) and gated on the auth decision
// in contract §0. The proxy is ready; svc will answer NOT_FOUND until it ships.
router.get('/svc/approval-status', svcApprovalStatus);

// Admin approval queue. svc re-checks operator authority on each of these; the
// browser-side admin check only decides what renders.
router.get('/svc/admin/approvals', svcAdminApprovals.list);
router.post('/svc/admin/approvals/:userId/approve', svcAdminApprovals.approve);
router.post('/svc/admin/approvals/:userId/reject', svcAdminApprovals.reject);

// Create user with identity provider (e.g. Facebook or Google)
// This endpoint is called to create a new user after user has confirmed
// they want to continue with the data fetched from IdP (e.g. name and email)
router.post('/auth/create-user-with-idp', createUserWithIdp);

// Facebook authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Facebook
router.get('/auth/facebook', authenticateFacebook);

// This is the route for callback URL the user is redirected after authenticating
// with Facebook. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Sharetribe Auth API to authenticate user to the marketplace
router.get('/auth/facebook/callback', authenticateFacebookCallback);

// Google authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Google
router.get('/auth/google', authenticateGoogle);

// This is the route for callback URL the user is redirected after authenticating
// with Google. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Sharetribe Auth API to authenticate user to the marketplace
router.get('/auth/google/callback', authenticateGoogleCallback);

module.exports = router;
