import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

// Contexts, configs, utils
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { isAdminUser } from '../../util/userHelpers';
import { createSlug } from '../../util/urlHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';

// Shared components
import {
  AdminNav,
  DashboardHeader,
  H3,
  IconSpinner,
  LayoutSideNavigation,
  NamedLink,
  NamedRedirect,
  Page,
  ReviewTable,
  StatusBadge,
} from '../../components';

// Containers from parent directory
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import css from './AdminClassesPage.module.css';

const COLUMNS = [
  { key: 'name', labelId: 'AdminClassesPage.columnClass' },
  { key: 'teacher', labelId: 'AdminClassesPage.columnTeacher' },
  { key: 'seats', labelId: 'AdminClassesPage.columnSeats' },
  { key: 'status', labelId: 'ReviewQueue.columnStatus' },
  { key: 'actions', labelId: 'ReviewQueue.columnActions', align: 'right' },
];

/**
 * Admin list of classes on the platform.
 *
 * Real data, unlike the other three secondary admin pages — but a narrower set of
 * columns than the design. See the duck: seats *sold*, the venue and the class date all
 * need sources this page does not have, so they are omitted rather than faked.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.currentUser current user entity
 * @param {Array} props.listings published listings of the events type
 * @param {boolean} props.queryInProgress whether the query is in flight
 * @param {Object} props.queryError error from the query
 * @param {boolean} props.scrollingDisabled
 * @returns {JSX.Element}
 */
export const AdminClassesPageComponent = props => {
  const {
    currentUser,
    listings = [],
    queryInProgress,
    queryError,
    scrollingDisabled,
  } = props;

  const intl = useIntl();

  // Second gate on top of the route's `auth`. Rendering only — the Marketplace API
  // enforces what this user can actually read.
  if (currentUser?.id && !isAdminUser(currentUser)) {
    return <NamedRedirect name="LandingPage" />;
  }

  const rows = listings.map(listing => {
    const id = listing?.id?.uuid;
    const title = listing?.attributes?.title || '';
    const teacher = listing?.author?.attributes?.profile?.displayName;
    // Seats remaining, not sold — see the duck.
    const seatsLeft = listing?.currentStock?.attributes?.quantity;

    return {
      id,
      cells: {
        name: (
          <NamedLink
            className={css.classLink}
            name="ListingPage"
            params={{ id, slug: createSlug(title) }}
          >
            {title}
          </NamedLink>
        ),
        teacher: teacher || '—',
        seats:
          seatsLeft == null
            ? '—'
            : intl.formatMessage({ id: 'AdminClassesPage.seatsLeft' }, { count: seatsLeft }),
        // A listings query returns published listings only, so this is constant today.
        status: <StatusBadge status="published" />,
        actions: (
          <NamedLink
            className={css.viewLink}
            name="ListingPage"
            params={{ id, slug: createSlug(title) }}
          >
            <FormattedMessage id="AdminClassesPage.view" />
          </NamedLink>
        ),
      },
    };
  });

  return (
    <Page
      title={intl.formatMessage({ id: 'AdminClassesPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSideNavigation
        topbar={<TopbarContainer />}
        sideNav={<AdminNav currentPage="AdminClassesPage" />}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <DashboardHeader
            eyebrowId="AdminClassesPage.eyebrow"
            titleId="AdminClassesPage.title"
            subtitleId="AdminClassesPage.subtitle"
          />

          {queryError ? (
            <div className={css.messagePanel}>
              <H3 as="h2">
                <FormattedMessage id="AdminClassesPage.queryFailed" />
              </H3>
            </div>
          ) : queryInProgress ? (
            <div className={css.messagePanel}>
              <IconSpinner />
            </div>
          ) : (
            <>
              <ReviewTable
                className={css.table}
                columns={COLUMNS}
                rows={rows}
                emptyMessageId="AdminClassesPage.empty"
              />
              <p className={css.footnote}>
                <FormattedMessage id="AdminClassesPage.limitations" />
              </p>
            </>
          )}
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const { listings, queryInProgress, queryError } = state.AdminClassesPage;

  return {
    currentUser,
    listings,
    queryInProgress,
    queryError,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const AdminClassesPage = compose(connect(mapStateToProps))(AdminClassesPageComponent);

export default AdminClassesPage;
