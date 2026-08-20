import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

// Contexts, configs, utils
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { isTeacherUser } from '../../util/userHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';

// Shared components
import {
  ApprovalBanner,
  DashboardHeader,
  H2,
  LayoutSideNavigation,
  NamedLink,
  NamedRedirect,
  Page,
  PrimaryButton,
  StatCard,
  StatCardRow,
} from '../../components';

// Containers from parent directory
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

// Same directory
import DashboardNav from './DashboardNav/DashboardNav';
import css from './TeacherDashboardPage.module.css';

/**
 * Sections of the design that the template already implements as full pages.
 *
 * InboxPage renders sale transactions with state handling, paging and empty states;
 * ManageListingsPage renders listings with open/close/discard and draft badges. Both
 * are linked rather than reimplemented as dashboard tables.
 */
const SECTIONS = [
  { key: 'bookings', name: 'InboxPage', params: { tab: 'sales' } },
  { key: 'listings', name: 'ManageListingsPage' },
];

/**
 * Teacher dashboard.
 *
 * Follows the design's structure: side rail, welcome header with a New listing action,
 * approval banner, stat row, then sections.
 *
 * Two figures from the design are deliberately absent rather than invented:
 *
 * - **Followers.** The follow backend is parked, and when it lands it exposes a count
 *   only, never a list.
 * - **Earnings** (gross / commission / net, paid out / pending). Not in svc's scope, and
 *   deriving it client-side means summing money across paged transaction responses,
 *   which silently caps at `perPage`. Counts are safe because `meta.totalItems` is a
 *   true total; sums are not. A wrong payout figure is worse than no payout figure.
 *
 * The third stat card shows published classes — real data — in place of the design's
 * follower count.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.currentUser current user entity
 * @param {string} props.approvalState 'pending' | 'approved' | 'rejected'
 * @param {boolean} props.approvalInProgress whether the status request is in flight
 * @param {Object} props.approvalError error from the status request
 * @param {Object} props.stats counts from the Marketplace API
 * @param {boolean} props.statsInProgress whether the counts are loading
 * @param {boolean} props.scrollingDisabled whether scrolling is disabled
 * @returns {JSX.Element}
 */
export const TeacherDashboardPageComponent = props => {
  const {
    currentUser,
    approvalState,
    approvalInProgress,
    approvalError,
    stats,
    statsInProgress,
    scrollingDisabled,
  } = props;
  const intl = useIntl();

  // `auth` on the route only proves the user is logged in. Wait for currentUser before
  // judging, so a slow profile fetch doesn't bounce a legitimate teacher.
  //
  // Send the wrong role home rather than to NoAccessPage: that page only handles the
  // four NO_ACCESS_PAGE_* rights and renders NotFoundPage for anything else, so
  // "this isn't your dashboard" would surface as a confusing 404.
  if (currentUser?.id && !isTeacherUser(currentUser)) {
    return <NamedRedirect name="LandingPage" />;
  }

  const firstName = currentUser?.attributes?.profile?.firstName;

  return (
    <Page
      title={intl.formatMessage({ id: 'TeacherDashboardPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSideNavigation
        topbar={<TopbarContainer currentPage="TeacherDashboardPage" />}
        sideNav={<DashboardNav currentPage="TeacherDashboardPage" />}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <div className={css.headerRow}>
            <DashboardHeader
              className={css.header}
              eyebrowId="TeacherDashboardPage.eyebrow"
              titleId={
                firstName ? 'TeacherDashboardPage.welcomeNamed' : 'TeacherDashboardPage.title'
              }
              titleValues={{ firstName }}
            />
            <NamedLink name="NewListingPage" className={css.newListingLink}>
              <PrimaryButton className={css.newListingButton} type="button">
                <FormattedMessage id="TeacherDashboardPage.newListing" />
              </PrimaryButton>
            </NamedLink>
          </div>

          <ApprovalBanner
            role="teacher"
            approvalState={approvalState}
            inProgress={approvalInProgress}
            error={approvalError}
          />

          <StatCardRow className={css.stats}>
            <StatCard
              labelId="TeacherDashboardPage.statClassesCompleted"
              value={stats?.classesCompleted}
              inProgress={statsInProgress}
            />
            <StatCard
              labelId="TeacherDashboardPage.statUpcomingBookings"
              value={stats?.upcomingBookings}
              inProgress={statsInProgress}
            />
            <StatCard
              labelId="TeacherDashboardPage.statPublishedClasses"
              value={stats?.publishedListings}
              inProgress={statsInProgress}
            />
          </StatCardRow>

          {SECTIONS.map(section => (
            <section key={section.key} className={css.section}>
              <div className={css.sectionHeader}>
                <H2 className={css.sectionTitle}>
                  <FormattedMessage id={'TeacherDashboardPage.section_' + section.key} />
                </H2>
                <NamedLink
                  name={section.name}
                  params={section.params}
                  className={css.sectionAction}
                >
                  <FormattedMessage id="TeacherDashboardPage.viewAll" />
                </NamedLink>
              </div>
              <p className={css.sectionBody}>
                <FormattedMessage id={'TeacherDashboardPage.sectionBody_' + section.key} />
              </p>
            </section>
          ))}
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    approvalState,
    approvalInProgress,
    approvalError,
    stats,
    statsInProgress,
    statsError,
  } = state.TeacherDashboardPage;

  return {
    currentUser,
    approvalState,
    approvalInProgress,
    approvalError,
    stats,
    statsInProgress,
    statsError,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const TeacherDashboardPage = compose(connect(mapStateToProps))(TeacherDashboardPageComponent);

export default TeacherDashboardPage;
