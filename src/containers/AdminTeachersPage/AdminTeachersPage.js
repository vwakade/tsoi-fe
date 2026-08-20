import React, { useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';

// Contexts, configs, utils
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { parse } from '../../util/urlHelpers';
import { isAdminUser } from '../../util/userHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';

// Shared components
import {
  DashboardHeader,
  H3,
  IconSpinner,
  InlineTextButton,
  LayoutSideNavigation,
  NamedLink,
  NamedRedirect,
  Page,
  PrimaryButton,
  ReviewTable,
  SecondaryButton,
  StatusBadge,
} from '../../components';

// Containers from parent directory
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

// Same directory
import AdminNav from './AdminNav/AdminNav';
import { approve, reject, FILTER_VALUES } from './AdminTeachersPage.duck';
import css from './AdminTeachersPage.module.css';

const COLUMNS = [
  { key: 'name', labelId: 'AdminTeachersPage.columnTeacher' },
  { key: 'discipline', labelId: 'AdminTeachersPage.columnDiscipline' },
  { key: 'applied', labelId: 'AdminTeachersPage.columnApplied' },
  { key: 'status', labelId: 'AdminTeachersPage.columnStatus' },
  { key: 'actions', labelId: 'AdminTeachersPage.columnActions', align: 'right' },
];

/**
 * Row actions. Approve and reject are both terminal — there is no suspend or
 * reinstate — so reject takes a second confirmation before it fires.
 */
const RowActions = props => {
  const { applicant, inProgress, onApprove, onReject } = props;
  const [confirmingReject, setConfirmingReject] = useState(false);

  // Approved and rejected are terminal: nothing to do from here.
  if (applicant.approvalState !== 'pending') {
    return (
      <span className={css.terminalNote}>
        <FormattedMessage id="AdminTeachersPage.noActions" />
      </span>
    );
  }

  if (confirmingReject) {
    return (
      <div className={css.actions}>
        <SecondaryButton
          className={css.actionButton}
          inProgress={inProgress}
          onClick={() => onReject(applicant.id)}
        >
          <FormattedMessage id="AdminTeachersPage.confirmReject" />
        </SecondaryButton>
        <InlineTextButton className={css.actionButton} onClick={() => setConfirmingReject(false)}>
          <FormattedMessage id="AdminTeachersPage.cancel" />
        </InlineTextButton>
      </div>
    );
  }

  return (
    <div className={css.actions}>
      <PrimaryButton
        className={css.actionButton}
        inProgress={inProgress}
        onClick={() => onApprove(applicant.id)}
      >
        <FormattedMessage id="AdminTeachersPage.approve" />
      </PrimaryButton>
      <SecondaryButton
        className={css.actionButton}
        disabled={inProgress}
        onClick={() => setConfirmingReject(true)}
      >
        <FormattedMessage id="AdminTeachersPage.reject" />
      </SecondaryButton>
    </div>
  );
};

const FilterNav = props => {
  const { currentStatus } = props;
  return (
    <nav className={css.filters}>
      {FILTER_VALUES.map(value => (
        <NamedLink
          key={value}
          name="AdminTeachersPage"
          to={{ search: value === 'all' ? '' : '?status=' + value }}
          className={value === currentStatus ? css.filterPillSelected : css.filterPill}
        >
          <FormattedMessage id={'AdminTeachersPage.filter_' + value} />
        </NamedLink>
      ))}
    </nav>
  );
};

/**
 * Admin queue for teacher applications.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.currentUser current user entity
 * @param {Array} props.applicants applicants returned by svc
 * @param {boolean} props.queryInProgress whether the list is loading
 * @param {Object} props.queryError error from the list request
 * @param {string} props.decisionInProgressId userId with a decision in flight
 * @param {Object} props.decisionError error from approve/reject
 * @param {Function} props.onApprove approve handler
 * @param {Function} props.onReject reject handler
 * @param {boolean} props.scrollingDisabled whether scrolling is disabled
 * @returns {JSX.Element}
 */
export const AdminTeachersPageComponent = props => {
  const {
    currentUser,
    applicants = [],
    queryInProgress,
    queryError,
    decisionInProgressId,
    decisionError,
    onApprove,
    onReject,
    scrollingDisabled,
  } = props;

  const intl = useIntl();
  const location = useLocation();
  const { status = 'all' } = parse(location.search);
  const currentStatus = FILTER_VALUES.includes(status) ? status : 'all';

  // The route already requires authentication; this is the second gate. It decides
  // only what renders — svc re-checks operator authority on every action.
  if (currentUser?.id && !isAdminUser(currentUser)) {
    // Home rather than NoAccessPage: that page only handles the four NO_ACCESS_PAGE_*
    // rights and renders NotFoundPage for anything else.
    return <NamedRedirect name="LandingPage" />;
  }

  const rows = applicants.map(applicant => ({
    id: applicant.id,
    cells: {
      name: (
        <div>
          <div className={css.applicantName}>
            {applicant.name || applicant.email || applicant.id}
          </div>
          {applicant.location ? (
            <div className={css.applicantMeta}>{applicant.location}</div>
          ) : null}
        </div>
      ),
      discipline: applicant.discipline || '—',
      applied: applicant.appliedAt
        ? intl.formatDate(new Date(applicant.appliedAt), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '—',
      status: <StatusBadge status={applicant.approvalState} />,
      actions: (
        <RowActions
          applicant={applicant}
          inProgress={decisionInProgressId === applicant.id}
          onApprove={onApprove}
          onReject={onReject}
        />
      ),
    },
  }));

  return (
    <Page
      title={intl.formatMessage({ id: 'AdminTeachersPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSideNavigation
        topbar={<TopbarContainer />}
        sideNav={<AdminNav currentPage="AdminTeachersPage" />}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <DashboardHeader
            eyebrowId="AdminTeachersPage.eyebrow"
            titleId="AdminTeachersPage.title"
            subtitleId="AdminTeachersPage.subtitle"
          />

          <FilterNav currentStatus={currentStatus} />

          {decisionError ? (
            <p className={css.error}>
              <FormattedMessage id="AdminTeachersPage.decisionFailed" />
            </p>
          ) : null}

          {queryError ? (
            <div className={css.messagePanel}>
              <H3 as="h2">
                <FormattedMessage id="AdminTeachersPage.queryFailed" />
              </H3>
              <p className={css.messageBody}>
                <FormattedMessage id="AdminTeachersPage.queryFailedBody" />
              </p>
            </div>
          ) : queryInProgress ? (
            <div className={css.messagePanel}>
              <IconSpinner />
            </div>
          ) : (
            <ReviewTable
              className={css.table}
              columns={COLUMNS}
              rows={rows}
              emptyMessageId="AdminTeachersPage.empty"
            />
          )}
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    applicants,
    queryInProgress,
    queryError,
    decisionInProgressId,
    decisionError,
  } = state.AdminTeachersPage;

  return {
    currentUser,
    applicants,
    queryInProgress,
    queryError,
    decisionInProgressId,
    decisionError,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = dispatch => ({
  onApprove: userId => dispatch(approve(userId)),
  onReject: (userId, reason) => dispatch(reject(userId, reason)),
});

const AdminTeachersPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(AdminTeachersPageComponent);

export default AdminTeachersPage;
