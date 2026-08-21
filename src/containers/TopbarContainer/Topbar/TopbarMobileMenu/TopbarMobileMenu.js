/**
 *  TopbarMobileMenu prints the menu content for authenticated user or
 * shows login actions for those who are not authenticated.
 */
import React from 'react';
import classNames from 'classnames';

import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
import { FormattedMessage } from '../../../../util/reactIntl';
import { ensureCurrentUser } from '../../../../util/data';
import { getDashboardRoute, isTeacherUser } from '../../../../util/userHelpers';

import {
  AvatarLarge,
  ExternalLink,
  InlineTextButton,
  NamedLink,
  NotificationBadge,
} from '../../../../components';

import css from './TopbarMobileMenu.module.css';

const CustomLinkComponent = ({ linkConfig, currentPage }) => {
  const { group, text, type, href, route } = linkConfig;
  const getCurrentPageClass = page => {
    const hasPageName = name => currentPage?.indexOf(name) === 0;
    const isCMSPage = pageId => hasPageName('CMSPage') && currentPage === `${page}:${pageId}`;
    const isInboxPage = tab => hasPageName('InboxPage') && currentPage === `${page}:${tab}`;
    const isCurrentPage = currentPage === page;

    return isCMSPage(route?.params?.pageId) || isInboxPage(route?.params?.tab) || isCurrentPage
      ? css.currentPage
      : null;
  };

  // Note: if the config contains 'route' keyword,
  // then in-app linking config has been resolved already.
  if (type === 'internal' && route) {
    // Internal link
    const { name, params, to } = route || {};
    const className = classNames(css.navigationLink, getCurrentPageClass(name));
    return (
      <li className={className}>
        <NamedLink name={name} params={params} to={to}>
          <span className={css.menuItemBorder} />
          {text}
        </NamedLink>
      </li>
    );
  }
  return (
    <li className={css.navigationLink}>
      <ExternalLink href={href}>
        <span className={css.menuItemBorder} />
        {text}
      </ExternalLink>
    </li>
  );
};

/**
 * The three public catalogs, as menu items. Mirrors `BrowseLinks` in TopbarDesktop —
 * same live Console listing type ids, same teacher-only rule for Browse Venues.
 *
 * @param {Object} options
 * @param {boolean} options.showVenues include Browse Venues (teachers only)
 * @param {boolean} options.withBorder render the menu-item border span, to match the
 *   custom-links list in the unauthenticated menu
 * @returns {Array<JSX.Element>}
 */
const browseMenuLinks = ({ showVenues, withBorder }) => {
  const links = [
    { listingType: 'teacher-profile', labelId: 'TopbarMobileMenu.browseTeachers' },
    { listingType: 'events', labelId: 'TopbarMobileMenu.browseEvents' },
  ];

  if (showVenues) {
    links.push({ listingType: 'venue', labelId: 'TopbarMobileMenu.browseVenues' });
  }

  return links.map(({ listingType, labelId }) => (
    <li key={listingType} className={css.navigationLink}>
      <NamedLink name="SearchPageWithListingType" params={{ listingType }}>
        {withBorder ? <span className={css.menuItemBorder} /> : null}
        <FormattedMessage id={labelId} />
      </NamedLink>
    </li>
  ));
};

/**
 * Menu for mobile layout (opens through hamburger icon)
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isAuthenticated
 * @param {string?} props.currentPage
 * @param {boolean} props.currentUserHasListings
 * @param {Object?} props.currentUser API entity
 * @param {number} props.notificationCount
 * @param {Array<Object>} props.customLinks Contains object like { group, text, type, href, route }
 * @param {Function} props.onLogout
 * @returns {JSX.Element} search icon
 */
const TopbarMobileMenu = props => {
  const {
    isAuthenticated,
    currentPage,
    inboxTab,
    currentUser,
    notificationCount = 0,
    customLinks,
    onLogout,
    showCreateListingsLink,
  } = props;

  const user = ensureCurrentUser(currentUser);

  const extraLinks = customLinks.map((linkConfig, index) => {
    return (
      <CustomLinkComponent
        key={`${linkConfig.text}_${index}`}
        linkConfig={linkConfig}
        currentPage={currentPage}
      />
    );
  });

  const createListingsLinkMaybe = showCreateListingsLink ? (
    <NamedLink className={css.createNewListingLink} name="NewListingPage">
      <FormattedMessage id="TopbarMobileMenu.newListingLink" />
    </NamedLink>
  ) : null;

  if (!isAuthenticated) {
    const signup = (
      <NamedLink name="SignupPage" className={css.signupLink}>
        <FormattedMessage id="TopbarMobileMenu.signupLink" />
      </NamedLink>
    );

    const login = (
      <NamedLink name="LoginPage" className={css.loginLink}>
        <FormattedMessage id="TopbarMobileMenu.loginLink" />
      </NamedLink>
    );

    const signupOrLogin = (
      <span className={css.authenticationLinks}>
        <FormattedMessage
          id="TopbarMobileMenu.signupOrLogin"
          values={{ lineBreak: <br />, signup, login }}
        />
      </span>
    );
    return (
      <nav className={css.root}>
        <div className={css.content}>
          <div className={css.authenticationGreeting}>
            <FormattedMessage
              id="TopbarMobileMenu.unauthorizedGreeting"
              values={{ lineBreak: <br />, signupOrLogin }}
            />
          </div>

          <ul className={css.customLinksWrapper}>
            {/* Browsing is public, so these show for signed-out visitors too. */}
            {browseMenuLinks({ showVenues: false, withBorder: true })}
            {extraLinks}
          </ul>

          <div className={css.spacer} />
        </div>
        <div className={css.footer}>{createListingsLinkMaybe}</div>
      </nav>
    );
  }

  const notificationCountBadge =
    notificationCount > 0 ? (
      <NotificationBadge className={css.notificationBadge} count={notificationCount} />
    ) : null;

  const displayName = user.attributes.profile.firstName;
  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    const isInboxPage = currentPage?.indexOf('InboxPage') === 0 && page?.indexOf('InboxPage') === 0;
    return currentPage === page || isAccountSettingsPage || isInboxPage ? css.currentPage : null;
  };

  // Shared with TopbarDesktop so the two menus cannot disagree about which roles have
  // a dashboard — they previously each covered only teacher and venue.
  const dashboard = getDashboardRoute(currentUser);
  const dashboardLinkMaybe = dashboard ? (
    <li className={classNames(css.navigationLink, currentPageClass(dashboard.routeName))}>
      <NamedLink name={dashboard.routeName}>
        <FormattedMessage id={`TopbarMobileMenu.${dashboard.messageKey}`} />
      </NamedLink>
    </li>
  ) : null;

  const manageListingsLinkMaybe = showCreateListingsLink ? (
    <li className={classNames(css.navigationLink, currentPageClass('ManageListingsPage'))}>
      <NamedLink name="ManageListingsPage">
        <FormattedMessage id="TopbarMobileMenu.yourListingsLink" />
      </NamedLink>
    </li>
  ) : null;

  return (
    <div className={css.root}>
      <AvatarLarge className={css.avatar} user={currentUser} />
      <div className={css.content}>
        <span className={css.greeting}>
          <FormattedMessage id="TopbarMobileMenu.greeting" values={{ displayName }} />
        </span>
        <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
          <FormattedMessage id="TopbarMobileMenu.logoutLink" />
        </InlineTextButton>

        <ul className={css.accountLinksWrapper}>
          {browseMenuLinks({
            showVenues: isTeacherUser(currentUser),
            withBorder: false,
          })}
          <li className={classNames(css.inbox, currentPageClass(`InboxPage:${inboxTab}`))}>
            <NamedLink name="InboxPage" params={{ tab: inboxTab }}>
              <FormattedMessage id="TopbarMobileMenu.inboxLink" />
              {notificationCountBadge}
            </NamedLink>
          </li>
          {dashboardLinkMaybe}
          {manageListingsLinkMaybe}
          <li className={classNames(css.navigationLink, currentPageClass('ProfileSettingsPage'))}>
            <NamedLink name="ProfileSettingsPage">
              <FormattedMessage id="TopbarMobileMenu.profileSettingsLink" />
            </NamedLink>
          </li>
          <li className={classNames(css.navigationLink, currentPageClass('AccountSettingsPage'))}>
            <NamedLink name="AccountSettingsPage">
              <FormattedMessage id="TopbarMobileMenu.accountSettingsLink" />
            </NamedLink>
          </li>
        </ul>
        <ul className={css.customLinksWrapper}>{extraLinks}</ul>
        <div className={css.spacer} />
      </div>
      <div className={css.footer}>{createListingsLinkMaybe}</div>
    </div>
  );
};

export default TopbarMobileMenu;
