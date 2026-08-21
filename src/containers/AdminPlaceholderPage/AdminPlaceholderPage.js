import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

// Contexts, configs, utils
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { isAdminUser } from '../../util/userHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';

// Shared components
import {
  AdminNav,
  DashboardHeader,
  H4,
  LayoutSideNavigation,
  NamedLink,
  NamedRedirect,
  Page,
} from '../../components';

// Containers from parent directory
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import css from './AdminPlaceholderPage.module.css';

/**
 * The three admin sections that exist in the design but have no data source yet.
 *
 * One component, registered under three routes via `extraProps` — the same pattern
 * `AuthenticationPage` uses for its login/signup/confirm tabs. They are real routes so
 * the rail is fully navigable, and each states plainly what is missing and who owns it
 * rather than showing an empty table that looks broken.
 *
 * | section       | blocked on                                                    |
 * |---------------|---------------------------------------------------------------|
 * | teacherVenues | svc serves `role=teacher\|venue` only — no endpoint exists      |
 * | bookings      | Marketplace API returns only the caller's own transactions     |
 * | settings      | commission / refund window / expiry are marketplace config     |
 *
 * When a section gains a backend, replace its route's component with a real container
 * rather than growing this one.
 */
const SECTIONS = {
  teacherVenues: { routeName: 'AdminTeacherVenuesPage', relatedPage: 'AdminVenuesPage' },
  bookings: { routeName: 'AdminBookingsPage', relatedPage: null },
  settings: { routeName: 'AdminSettingsPage', relatedPage: null },
};

/**
 * @component
 * @param {Object} props
 * @param {string} props.section one of 'teacherVenues' | 'bookings' | 'settings'
 * @param {Object} props.currentUser current user entity
 * @param {boolean} props.scrollingDisabled
 * @returns {JSX.Element}
 */
export const AdminPlaceholderPageComponent = props => {
  const { section, currentUser, scrollingDisabled } = props;
  const intl = useIntl();

  const config = SECTIONS[section];

  if (currentUser?.id && !isAdminUser(currentUser)) {
    return <NamedRedirect name="LandingPage" />;
  }

  // A typo in a route's extraProps would otherwise render a page of blank messages.
  if (!config) {
    return <NamedRedirect name="AdminOverviewPage" />;
  }

  const titleId = `AdminPlaceholderPage.${section}.title`;

  return (
    <Page title={intl.formatMessage({ id: titleId })} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={<TopbarContainer />}
        sideNav={<AdminNav currentPage={config.routeName} />}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <DashboardHeader
            eyebrowId="AdminOverviewPage.eyebrow"
            titleId={titleId}
            subtitleId={`AdminPlaceholderPage.${section}.subtitle`}
          />

          <div className={css.panel}>
            <H4 as="h2" className={css.panelTitle}>
              <FormattedMessage id="AdminPlaceholderPage.notAvailableTitle" />
            </H4>
            <p className={css.panelBody}>
              <FormattedMessage id={`AdminPlaceholderPage.${section}.reason`} />
            </p>
            {config.relatedPage ? (
              <NamedLink className={css.panelLink} name={config.relatedPage}>
                <FormattedMessage id={`AdminPlaceholderPage.${section}.related`} />
              </NamedLink>
            ) : null}
          </div>
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => ({
  currentUser: state.user.currentUser,
  scrollingDisabled: isScrollingDisabled(state),
});

const AdminPlaceholderPage = compose(connect(mapStateToProps))(AdminPlaceholderPageComponent);

export default AdminPlaceholderPage;
