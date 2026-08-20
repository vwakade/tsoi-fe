import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

// Contexts, configs, utils
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { isVenueUser } from '../../util/userHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';

// Shared components
import {
  ApprovalBanner,
  DashboardHeader,
  H2,
  LayoutSingleColumn,
  NamedLink,
  NamedRedirect,
  Page,
} from '../../components';

// Containers from parent directory
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

// Same directory
import css from './VenueDashboardPage.module.css';

/**
 * Entry points into pages the template already implements.
 *
 * The design draws Incoming requests, Confirmed events and a Calendar as sections of
 * one dashboard. Requests and confirmed events are both transactions on the venue
 * listing, which InboxPage already renders with state handling and paging; the calendar
 * is the availability editor that EditListingPage already provides per listing. So this
 * hub links out rather than reimplementing either.
 *
 * Availability is deliberately reached via the listings page rather than linked
 * directly: EditListingPage needs a specific listing id, and a venue owner may have
 * more than one venue.
 */
const DESTINATIONS = [
  {
    key: 'requests',
    name: 'InboxPage',
    params: { tab: 'sales' },
  },
  {
    key: 'listings',
    name: 'ManageListingsPage',
  },
  {
    key: 'profile',
    name: 'ProfileSettingsPage',
  },
  {
    key: 'account',
    name: 'ContactDetailsPage',
  },
];

/**
 * Venue hub.
 *
 * Same thin shape as the teacher hub: the approval banner plus links into existing
 * pages. Stat cards are omitted rather than stubbed — the rollups they need (incoming
 * requests by state, upcoming bookings, confirmed/declined/expired counts) are PLANNED
 * on svc, and a dashboard of zeros reads as "you have nothing".
 *
 * @component
 * @param {Object} props
 * @param {Object} props.currentUser current user entity
 * @param {string} props.approvalState 'pending' | 'approved' | 'rejected'
 * @param {boolean} props.approvalInProgress whether the status request is in flight
 * @param {Object} props.approvalError error from the status request
 * @param {boolean} props.scrollingDisabled whether scrolling is disabled
 * @returns {JSX.Element}
 */
export const VenueDashboardPageComponent = props => {
  const {
    currentUser,
    approvalState,
    approvalInProgress,
    approvalError,
    scrollingDisabled,
  } = props;
  const intl = useIntl();

  // `auth` on the route only proves the user is logged in. Wait for currentUser before
  // judging, so a slow profile fetch doesn't bounce a legitimate venue owner.
  //
  // Send the wrong role home rather than to NoAccessPage: that page only handles the
  // four NO_ACCESS_PAGE_* rights and renders NotFoundPage for anything else.
  if (currentUser?.id && !isVenueUser(currentUser)) {
    return <NamedRedirect name="LandingPage" />;
  }

  return (
    <Page
      title={intl.formatMessage({ id: 'VenueDashboardPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.content}>
          <DashboardHeader
            eyebrowId="VenueDashboardPage.eyebrow"
            titleId="VenueDashboardPage.title"
          />

          <ApprovalBanner
            role="venue"
            approvalState={approvalState}
            inProgress={approvalInProgress}
            error={approvalError}
          />

          <H2 className={css.sectionTitle}>
            <FormattedMessage id="VenueDashboardPage.manageHeading" />
          </H2>
          <ul className={css.destinations}>
            {DESTINATIONS.map(destination => (
              <li key={destination.key} className={css.destinationItem}>
                <NamedLink
                  name={destination.name}
                  params={destination.params}
                  className={css.destination}
                >
                  <span className={css.destinationTitle}>
                    <FormattedMessage id={'VenueDashboardPage.link_' + destination.key} />
                  </span>
                  <span className={css.destinationBody}>
                    <FormattedMessage id={'VenueDashboardPage.linkBody_' + destination.key} />
                  </span>
                </NamedLink>
              </li>
            ))}
          </ul>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const { approvalState, approvalInProgress, approvalError } = state.VenueDashboardPage;

  return {
    currentUser,
    approvalState,
    approvalInProgress,
    approvalError,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const VenueDashboardPage = compose(connect(mapStateToProps))(VenueDashboardPageComponent);

export default VenueDashboardPage;
