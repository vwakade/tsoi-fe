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
  H3,
  H4,
  LayoutSideNavigation,
  NamedLink,
  NamedRedirect,
  Page,
  StatCard,
  StatCardRow,
} from '../../components';

// Containers from parent directory
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import css from './AdminOverviewPage.module.css';

/**
 * One pending-approvals column: teacher applications or venue applications.
 *
 * Renders three distinct states rather than collapsing them: a list, "nothing waiting",
 * and "could not load". On an approvals dashboard an empty queue and an unreachable
 * backend must never look the same — one means "you are done", the other means "you are
 * blind".
 */
const PendingPanel = props => {
  const { titleId, applicants, inProgress, reviewPageName, emptyId, intl } = props;

  const body = inProgress ? (
    <p className={css.panelNote}>
      <FormattedMessage id="AdminOverviewPage.loading" />
    </p>
  ) : applicants === null ? (
    <p className={css.panelNote}>
      <FormattedMessage id="AdminOverviewPage.sectionUnavailable" />
    </p>
  ) : applicants.length === 0 ? (
    <p className={css.panelNote}>
      <FormattedMessage id={emptyId} />
    </p>
  ) : (
    <ul className={css.panelList}>
      {applicants.map(applicant => (
        <li key={applicant.id} className={css.panelItem}>
          <div>
            <div className={css.panelItemName}>
              {applicant.name || applicant.email || applicant.id}
            </div>
            <div className={css.panelItemMeta}>
              {[
                applicant.discipline || applicant.venueType,
                applicant.appliedAt
                  ? intl.formatDate(new Date(applicant.appliedAt), {
                      month: 'short',
                      day: 'numeric',
                    })
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
          <NamedLink className={css.panelItemLink} name={reviewPageName}>
            <FormattedMessage id="AdminOverviewPage.review" />
          </NamedLink>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={css.panel}>
      <div className={css.panelLabel}>
        <FormattedMessage id={titleId} />
      </div>
      {body}
    </div>
  );
};

/**
 * Admin platform overview.
 *
 * Matches the design's structure — stat row, pending approvals, recent bookings — but
 * only three of the six figures have a data source. Bookings, gross revenue and
 * commission, and the recent-bookings table, are rendered as explicitly unavailable:
 * `sdk.transactions.query()` returns only the calling user's transactions, so platform
 * totals cannot be read through the Marketplace API at all, and svc has not committed
 * to the rollups. See the duck for the full source table.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.currentUser current user entity
 * @param {Array|null} props.pendingTeachers pending teacher applications, null on failure
 * @param {Array|null} props.pendingVenues pending venue applications, null on failure
 * @param {Object|null} props.teacherCount {count, isCapped} approved teachers
 * @param {Object|null} props.venueCount {count, isCapped} approved venues
 * @param {boolean} props.approvalsInProgress whether svc calls are in flight
 * @param {boolean} props.approvalsFailed whether every svc call failed
 * @param {number|null} props.activeClasses published listings of the events type
 * @param {boolean} props.activeClassesInProgress
 * @param {boolean} props.scrollingDisabled
 * @returns {JSX.Element}
 */
export const AdminOverviewPageComponent = props => {
  const {
    currentUser,
    pendingTeachers,
    pendingVenues,
    teacherCount,
    venueCount,
    approvalsInProgress,
    approvalsFailed,
    activeClasses,
    activeClassesInProgress,
    scrollingDisabled,
  } = props;

  const intl = useIntl();

  // Second gate on top of the route's `auth`. Rendering only — svc re-checks authority.
  if (currentUser?.id && !isAdminUser(currentUser)) {
    return <NamedRedirect name="LandingPage" />;
  }

  // Only count what was actually loaded. Adding a failed queue in as 0 would report a
  // smaller backlog than reality, which is the wrong way for this number to be wrong.
  const knownPending = [pendingTeachers, pendingVenues].filter(Array.isArray);
  const pendingCount = knownPending.reduce((sum, list) => sum + list.length, 0);
  const pendingIsPartial = knownPending.length < 2;

  return (
    <Page
      title={intl.formatMessage({ id: 'AdminOverviewPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSideNavigation
        topbar={<TopbarContainer />}
        sideNav={<AdminNav currentPage="AdminOverviewPage" />}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <DashboardHeader
            eyebrowId="AdminOverviewPage.eyebrow"
            titleId="AdminOverviewPage.title"
          />

          {approvalsFailed ? (
            <p className={css.error}>
              <FormattedMessage id="AdminOverviewPage.approvalsUnavailable" />
            </p>
          ) : null}

          <StatCardRow className={css.stats}>
            <StatCard
              labelId="AdminOverviewPage.statTeachers"
              value={teacherCount?.count}
              inProgress={approvalsInProgress}
            />
            <StatCard
              labelId="AdminOverviewPage.statVenues"
              value={venueCount?.count}
              inProgress={approvalsInProgress}
            />
            <StatCard
              labelId="AdminOverviewPage.statActiveClasses"
              value={activeClasses}
              inProgress={activeClassesInProgress}
            />
            {/*
              These three have no data source. See the duck: the Marketplace API cannot
              return another user's transactions, so an operator cannot total platform
              bookings or revenue, and svc has not committed to the rollups.
            */}
            <StatCard
              labelId="AdminOverviewPage.statBookings"
              unavailableId="AdminOverviewPage.needsBackend"
            />
            <StatCard
              labelId="AdminOverviewPage.statGrossRevenue"
              unavailableId="AdminOverviewPage.needsBackend"
            />
            {/*
              The design labels this "Commission (15%)". The rate is marketplace
              configuration this app cannot read, so the label stays rateless rather
              than hardcoding a number that could silently go stale.
            */}
            <StatCard
              labelId="AdminOverviewPage.statCommission"
              unavailableId="AdminOverviewPage.needsBackend"
              accent
            />
          </StatCardRow>

          {teacherCount?.isCapped || venueCount?.isCapped ? (
            <p className={css.footnote}>
              <FormattedMessage id="AdminOverviewPage.countsCapped" />
            </p>
          ) : null}

          <section className={css.section}>
            <div className={css.sectionHeader}>
              <H3 as="h2" className={css.sectionTitle}>
                <FormattedMessage id="AdminOverviewPage.pendingApprovals" />
              </H3>
              {approvalsInProgress ? null : (
                <span className={css.waitingBadge}>
                  <FormattedMessage
                    id={
                      pendingIsPartial
                        ? 'AdminOverviewPage.waitingPartial'
                        : 'AdminOverviewPage.waiting'
                    }
                    values={{ count: pendingCount }}
                  />
                </span>
              )}
            </div>

            <div className={css.panels}>
              <PendingPanel
                titleId="AdminOverviewPage.teacherApplications"
                applicants={pendingTeachers}
                inProgress={approvalsInProgress}
                reviewPageName="AdminTeachersPage"
                emptyId="AdminOverviewPage.noTeacherApplications"
                intl={intl}
              />
              <PendingPanel
                titleId="AdminOverviewPage.venueApplications"
                applicants={pendingVenues}
                inProgress={approvalsInProgress}
                reviewPageName="AdminVenuesPage"
                emptyId="AdminOverviewPage.noVenueApplications"
                intl={intl}
              />
            </div>
          </section>

          <section className={css.section}>
            <div className={css.sectionHeader}>
              <H3 as="h2" className={css.sectionTitle}>
                <FormattedMessage id="AdminOverviewPage.recentBookings" />
              </H3>
            </div>
            {/*
              The design shows a table of platform-wide bookings here. Deliberately not
              built: there is no endpoint that can return it, and a table of the
              prototype's sample rows on an admin page would be read as real.
            */}
            <div className={css.placeholderPanel}>
              <H4 as="h3" className={css.placeholderTitle}>
                <FormattedMessage id="AdminOverviewPage.bookingsUnavailableTitle" />
              </H4>
              <p className={css.placeholderBody}>
                <FormattedMessage id="AdminOverviewPage.bookingsUnavailableBody" />
              </p>
            </div>
          </section>
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    pendingTeachers,
    pendingVenues,
    teacherCount,
    venueCount,
    approvalsInProgress,
    approvalsFailed,
    activeClasses,
    activeClassesInProgress,
  } = state.AdminOverviewPage;

  return {
    currentUser,
    pendingTeachers,
    pendingVenues,
    teacherCount,
    venueCount,
    approvalsInProgress,
    approvalsFailed,
    activeClasses,
    activeClassesInProgress,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const AdminOverviewPage = compose(connect(mapStateToProps))(AdminOverviewPageComponent);

export default AdminOverviewPage;
