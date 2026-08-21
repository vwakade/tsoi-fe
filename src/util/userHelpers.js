import { EXTENDED_DATA_SCHEMA_TYPES } from './types';
import { getFieldValue } from './fieldHelpers';

/**
 * Get the namespaced attribute key based on the specified extended data scope and attribute key
 * @param {*} scope extended data scope
 * @param {*} key attribute key in extended data
 * @returns a string containing the namespace prefix and the attribute name
 */
export const addScopePrefix = (scope, key) => {
  const scopeFnMap = {
    private: k => `priv_${k}`,
    protected: k => `prot_${k}`,
    public: k => `pub_${k}`,
    meta: k => `meta_${k}`,
  };

  const validKey = key.replace(/\s/g, '_');
  const keyScoper = scopeFnMap[scope];

  return !!keyScoper ? keyScoper(validKey) : validKey;
};

/**
 * Pick extended data fields from given form data.
 * Picking is based on extended data configuration for the user and target scope and user type.
 *
 * This expects submit data to be namespaced (e.g. 'pub_') and it returns the field without that namespace.
 * This function is used when form submit values are restructured for the actual API endpoint.
 *
 * Note: This returns null for those fields that are managed by configuration, but don't match target user type.
 *       These might exists if user swaps between user types before saving the user.
 *
 * @param {Object} data values to look through against userConfig.js and util/configHelpers.js
 * @param {String} targetScope Check that the scope of extended data the config matches
 * @param {String} targetUserType Check that the extended data is relevant for this user type.
 * @param {Object} userFieldConfigs Extended data configurations for user fields.
 * @returns Array of picked extended data fields from submitted data.
 */
export const pickUserFieldsData = (data, targetScope, targetUserType, userFieldConfigs) => {
  return userFieldConfigs.reduce((fields, field) => {
    const { key, userTypeConfig, scope = 'public', schemaType } = field || {};
    const namespacedKey = addScopePrefix(scope, key);

    const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
    const isTargetScope = scope === targetScope;
    const isTargetUserType =
      !userTypeConfig.limitToUserTypeIds || userTypeConfig.userTypeIds.includes(targetUserType);

    if (isKnownSchemaType && isTargetScope && isTargetUserType) {
      const fieldValue = getFieldValue(data, namespacedKey);
      return { ...fields, [key]: fieldValue };
    } else if (isKnownSchemaType && isTargetScope && !isTargetUserType) {
      // Note: this clears extra custom fields
      // These might exists if user swaps between user types before saving the user.
      return { ...fields, [key]: null };
    }
    return fields;
  }, {});
};

/**
 * Pick extended data fields from given extended data of the user entity.
 * Picking is based on extended data configuration for the user and target scope and user type.
 *
 * This returns namespaced (e.g. 'pub_') initial values for the form.
 *
 * @param {Object} data extended data values to look through against userConfig.js and util/configHelpers.js
 * @param {String} targetScope Check that the scope of extended data the config matches
 * @param {String} targetUserType Check that the extended data is relevant for this user type.
 * @param {Object} userFieldConfigs Extended data configurations for user fields.
 * @returns Array of picked extended data fields
 */
export const initialValuesForUserFields = (data, targetScope, targetUserType, userFieldConfigs) => {
  return userFieldConfigs.reduce((fields, field) => {
    const { key, userTypeConfig, scope = 'public', schemaType } = field || {};
    const namespacedKey = addScopePrefix(scope, key);

    const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
    const isTargetScope = scope === targetScope;
    const isTargetUserType =
      !userTypeConfig?.limitToUserTypeIds || userTypeConfig?.userTypeIds?.includes(targetUserType);

    if (isKnownSchemaType && isTargetScope && isTargetUserType) {
      const fieldValue = getFieldValue(data, key);
      return { ...fields, [namespacedKey]: fieldValue };
    }
    return fields;
  }, {});
};

/**
 * Returns props for custom user fields
 * @param {*} userFieldsConfig Configuration for user fields
 * @param {*} userType User type to restrict fields to. If none is passed,
 * only user fields applying to all user types are returned.
 * @param {*} isSignup Optional flag to determine whether the target context
 * is a signup form. Defaults to true.
 * @returns an array of props for CustomExtendedDataField: key, name,
 * fieldConfig, defaultRequiredMessage
 */
export const getPropsForCustomUserFieldInputs = (
  userFieldsConfig,
  userType = null,
  isSignup = true
) => {
  return (
    userFieldsConfig?.reduce((pickedFields, fieldConfig) => {
      const { key, userTypeConfig, schemaType, scope, saveConfig = {} } = fieldConfig || {};
      const namespacedKey = addScopePrefix(scope, key);
      const showField = isSignup ? saveConfig.displayInSignUp : true;

      const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
      const isTargetUserType =
        !userTypeConfig?.limitToUserTypeIds || userTypeConfig?.userTypeIds?.includes(userType);
      const isUserScope = ['public', 'private', 'protected'].includes(scope);

      return isKnownSchemaType && isTargetUserType && isUserScope && showField
        ? [
            ...pickedFields,
            {
              key: namespacedKey,
              name: namespacedKey,
              fieldConfig: fieldConfig,
            },
          ]
        : pickedFields;
    }, []) || []
  );
};

/**
 * Check if currentUser has permission to post listings.
 * Defined in currentUser's effectivePermissionSet relationship:
 * https://www.sharetribe.com/api-reference/marketplace.html#currentuser-permissionset
 *
 * @param {Object} currentUser API entity
 * @returns {Boolean} true if currentUser has permission to post listings.
 */
export const hasPermissionToPostListings = currentUser => {
  if (currentUser?.id && !currentUser?.effectivePermissionSet?.id) {
    console.warn(
      '"effectivePermissionSet" relationship is not defined or included to the fetched currentUser entity.'
    );
  }
  return currentUser?.effectivePermissionSet?.attributes?.postListings === 'permission/allow';
};

/**
 * Check if currentUser has permission to initiate transactions.
 * Defined in currentUser's effectivePermissionSet relationship:
 * https://www.sharetribe.com/api-reference/marketplace.html#currentuser-permissionset
 *
 * @param {Object} currentUser API entity
 * @returns {Boolean} true if currentUser has permission to initiate transactions.
 */
export const hasPermissionToInitiateTransactions = currentUser => {
  if (currentUser?.id && !currentUser?.effectivePermissionSet?.id) {
    console.warn(
      '"effectivePermissionSet" relationship is not defined or included to the fetched currentUser entity.'
    );
  }
  return (
    currentUser?.effectivePermissionSet?.attributes?.initiateTransactions === 'permission/allow'
  );
};

/**
 * Check if currentUser has permission to view listing and user data on a private marketplace.
 * Defined in currentUser's effectivePermissionSet relationship:
 * https://www.sharetribe.com/api-reference/marketplace.html#currentuser-permissionset
 *
 * @param {Object} currentUser API entity
 * @returns {Boolean} true if currentUser has permission to view listing and user data on a private marketplace.
 */
export const hasPermissionToViewData = currentUser => {
  if (currentUser?.id && !currentUser?.effectivePermissionSet?.id) {
    console.warn(
      '"effectivePermissionSet" relationship is not defined or included to the fetched currentUser entity.'
    );
  }
  return currentUser?.effectivePermissionSet?.attributes?.read === 'permission/allow';
};

/**
 * Check if currentUser has been approved to gain access.
 * I.e. they are not in 'pending-approval' or 'banned' state.
 *
 * If the user is in 'pending-approval' state, they don't have right to post listings and initiate transactions.
 *
 * @param {Object} currentUser API entity.
 * @returns {Boolean} true if currentUser has been approved (state is 'active').
 */
export const isUserAuthorized = currentUser => currentUser?.attributes?.state === 'active';

/**
 * Get the user type configuration for the current user's user type
 * @param {*} config marketplace configuration
 * @param {*} currentUser API entity
 * @returns a single user type configuration, if found
 */
const getCurrentUserTypeConfig = (config, currentUser) => {
  const { userTypes } = config.user;
  return userTypes.find(
    ut => ut.userType === currentUser?.attributes?.profile?.publicData?.userType
  );
};

/**
 * Check if the links for creating a new listing should be shown to the
 * user currently browsing the marketplace.
 * @param {Object} config Marketplace configuration
 * @param {Object} currentUser API entity
 * @returns {Boolean} true if the currentUser's user type, or the anonymous user configuration, is set to see the link
 */
export const showCreateListingLinkForUser = (config, currentUser) => {
  const { topbar } = config;
  const currentUserTypeConfig = getCurrentUserTypeConfig(config, currentUser);

  const { accountLinksVisibility } = currentUserTypeConfig || {};

  return currentUser && accountLinksVisibility
    ? accountLinksVisibility.postListings
    : currentUser
    ? true
    : topbar?.postListingsLink
    ? topbar.postListingsLink.showToUnauthenticatedUsers
    : true;
};

/**
 * Check if payout details tab and payout methods tab should be shown for the user
 * @param {Object} config Marketplace configuration
 * @param {*} currentUser API entity
 * @returns {Object} { showPayoutDetails: Boolean, showPaymentMethods: boolean }
 */
export const showPaymentDetailsForUser = (config, currentUser) => {
  const currentUserTypeConfig = getCurrentUserTypeConfig(config, currentUser);
  const { paymentMethods = true, payoutDetails = true } =
    currentUserTypeConfig?.accountLinksVisibility || {};

  return currentUser
    ? {
        showPayoutDetails: payoutDetails,
        showPaymentMethods: paymentMethods,
      }
    : {
        showPayoutDetails: false,
        showPaymentMethods: false,
      };
};

/**
 * Check the roles defined for the current user
 * @param {*} config Marketplace configuration
 * @param {*} currentUser API entity
 * @returns Object with attributes 'customer' and 'provider' and boolean values for each
 */
export const getCurrentUserTypeRoles = (config, currentUser) => {
  const currentUserTypeConfig = getCurrentUserTypeConfig(config, currentUser);
  return (
    currentUserTypeConfig?.roles || {
      customer: true,
      provider: true,
    }
  );
};

/**
 * User ids listed in REACT_APP_ADMIN_USER_IDS, as a comma-separated list.
 *
 * Read on each call rather than at module load so tests can set the variable, and so a
 * server restart is not needed to pick up a change during development.
 *
 * @returns {Array<string>} user uuids
 */
const adminIdAllowlist = () =>
  (process.env.REACT_APP_ADMIN_USER_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

/**
 * Whether the current user should be shown admin UI.
 *
 * ⚠️ PROVISIONAL — the svc contract exposes no way for the browser to learn that a
 * user is an operator. svc loads roles itself via the Integration API, and
 * /me/approval-status reports approval state, not role. Candidates under discussion:
 * a /me/permissions projection on svc, an ops-written publicData flag (what this reads
 * today), or probing an admin endpoint and hiding on FORBIDDEN.
 *
 * This gates *rendering only*. svc re-checks operator authority on every privileged
 * action, so a wrong answer here is a UX bug, never a security hole. Keep this the
 * single place that decides, so swapping the mechanism is a one-line change.
 *
 * @param {Object} currentUser API entity
 * @returns {boolean} true if admin UI should render
 */
export const isAdminUser = currentUser => {
  if (currentUser?.attributes?.profile?.publicData?.isAdmin === true) {
    return true;
  }

  // ⚠️ INTERIM, remove once svc exposes roles. Console has no UI for editing a user's
  // publicData, so without this there is no way to become an admin short of writing an
  // Integration API script — which left the admin pages unreachable in development.
  //
  // Safe because this gates rendering only: svc re-checks operator authority on every
  // privileged action, so an id listed here still cannot approve anything it should not.
  // The value is inlined into the client bundle by REACT_APP_, so put user ids here and
  // never anything secret.
  const id = currentUser?.id?.uuid;
  return !!id && adminIdAllowlist().includes(id);
};

/**
 * The user's marketplace role, from publicData.userType.
 *
 * Sharetribe allows exactly one userType per user, so "multi-persona" comes from the
 * roles attached to that type, not from multiple types. With the current Console
 * config: `teacher` carries both provider and customer roles (so a teacher can also
 * book, and sees both a Teacher and a Student view), while `venue` is provider-only.
 *
 * Admin is deliberately absent — it is not a userType. See isAdminUser.
 *
 * @param {Object} currentUser API entity
 * @returns {string|null} 'student' | 'teacher' | 'venue' | other configured type
 */
export const getUserType = currentUser => {
  return currentUser?.attributes?.profile?.publicData?.userType || null;
};

/** @returns {boolean} true if the user's type is 'teacher' */
export const isTeacherUser = currentUser => getUserType(currentUser) === 'teacher';

/** @returns {boolean} true if the user's type is 'venue' */
export const isVenueUser = currentUser => getUserType(currentUser) === 'venue';

/** @returns {boolean} true if the user's type is 'student' */
export const isStudentUser = currentUser => getUserType(currentUser) === 'student';

/**
 * The dashboard route for a user, or null if they have none.
 *
 * Kept here rather than duplicated in TopbarDesktop and TopbarMobileMenu, which
 * previously each handled only teacher and venue — so students, admins, and the
 * leftover `customer` / `provider` types got no dashboard link at all.
 *
 * Admin is checked first: it is a flag rather than a userType, so an admin also has
 * one of the ordinary types underneath and would otherwise match that instead.
 *
 * @param {Object} currentUser API entity
 * @returns {{routeName: string, messageKey: string}|null}
 */
export const getDashboardRoute = currentUser => {
  if (isAdminUser(currentUser)) {
    return { routeName: 'AdminOverviewPage', messageKey: 'adminDashboardLink' };
  }
  if (isTeacherUser(currentUser)) {
    return { routeName: 'TeacherDashboardPage', messageKey: 'teacherDashboardLink' };
  }
  if (isVenueUser(currentUser)) {
    return { routeName: 'VenueDashboardPage', messageKey: 'venueDashboardLink' };
  }
  if (isStudentUser(currentUser)) {
    // Redirects to the orders inbox — the student overview *is* the inbox.
    return { routeName: 'StudentDashboardPage', messageKey: 'studentDashboardLink' };
  }
  return null;
};
