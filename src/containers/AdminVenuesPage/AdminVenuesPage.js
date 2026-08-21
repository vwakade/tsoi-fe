import React, { useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';

// Contexts, configs, utils
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { parse } from '../../util/urlHelpers';
import { isAdminUser } from '../../util/userHelpers';
import { FILTER_VALUES } from '../../util/approvalQueue';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';

// Shared components
import {
  AdminNav,
  DashboardHeader,
  H3,
  IconSpinner,
  InlineTextButton,
  LayoutSideNavigation,
  NamedRedirect,
  Page,
  PanelChips,
  PanelSection,
  ReviewFilterNav,
  ReviewPreviewPanel,
  ReviewRowActions,
  ReviewTable,
  StatusBadge,
} from '../../components';

// Containers from parent directory
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

// Same directory
import { approve, reject } from './AdminVenuesPage.duck';
import css from './AdminVenuesPage.module.css';

const COLUMNS = [
  { key: 'name', labelId: 'AdminVenuesPage.columnVenue' },
  { key: 'type', labelId: 'AdminVenuesPage.columnType' },
  { key: 'applied', labelId: 'ReviewQueue.columnApplied' },
  { key: 'capacity', labelId: 'AdminVenuesPage.columnCapacity' },
  { key: 'status', labelId: 'ReviewQueue.columnStatus' },
  { key: 'actions', labelId: 'ReviewQueue.columnActions', align: 'right' },
];

/**
 * Admin queue for venue applications.
 *
 * Structurally identical to the teachers queue — same table, filter pills, row actions
 * and preview drawer, differing only in columns, drawer body and copy.
 *
 * The design's **Source** column and its teacher-provided rows are deliberately absent:
 * svc serves `role=teacher|venue` and nothing else, so there is no endpoint behind the
 * teacher-provided venues queue. Adding the column would imply a distinction this page
 * cannot actually make.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.currentUser current user entity
 * @param {Array} props.applicants venue applications returned by svc
 * @param {boolean} props.queryInProgress whether the list is loading
 * @param {Object} props.queryError error from the list request
 * @param {string} props.decisionInProgressId userId with a decision in flight
 * @param {Object} props.decisionError error from approve/reject
 * @param {Function} props.onApprove approve handler
 * @param {Function} props.onReject reject handler
 * @param {Function} props.onManageDisableScrolling required by the preview drawer's Modal
 * @param {boolean} props.scrollingDisabled whether scrolling is disabled
 * @returns {JSX.Element}
 */
export const AdminVenuesPageComponent = props => {
  const {
    currentUser,
    applicants = [],
    queryInProgress,
    queryError,
    decisionInProgressId,
    decisionError,
    onApprove,
    onReject,
    onManageDisableScrolling,
    scrollingDisabled,
  } = props;

  const intl = useIntl();
  const location = useLocation();
  const { status = 'all' } = parse(location.search);
  const currentStatus = FILTER_VALUES.includes(status) ? status : 'all';

  const [previewId, setPreviewId] = useState(null);

  // Second gate on top of the route's `auth`. It decides only what renders — svc
  // re-checks operator authority on every action.
  if (currentUser?.id && !isAdminUser(currentUser)) {
    // Home rather than NoAccessPage, which renders NotFoundPage for anything outside
    // the four NO_ACCESS_PAGE_* rights.
    return <NamedRedirect name="LandingPage" />;
  }

  const formatApplied = value =>
    value
      ? intl.formatDate(new Date(value), { year: 'numeric', month: 'short', day: 'numeric' })
      : null;

  const rows = applicants.map(applicant => ({
    id: applicant.id,
    cells: {
      name: (
        <div>
          <InlineTextButton
            className={css.applicantNameButton}
            onClick={() => setPreviewId(applicant.id)}
          >
            {applicant.name || applicant.email || applicant.id}
          </InlineTextButton>
          {applicant.neighborhood ? (
            <div className={css.applicantMeta}>{applicant.neighborhood}</div>
          ) : null}
        </div>
      ),
      type: applicant.venueType || '—',
      applied: formatApplied(applicant.appliedAt) || '—',
      capacity: applicant.capacity ?? '—',
      status: <StatusBadge status={applicant.approvalState} />,
      actions: (
        <ReviewRowActions
          status={applicant.approvalState}
          inProgress={decisionInProgressId === applicant.id}
          onApprove={() => onApprove(applicant.id)}
          onReject={() => onReject(applicant.id)}
          onPreview={() => setPreviewId(applicant.id)}
        />
      ),
    },
  }));

  const previewApplicant = applicants.find(a => a.id === previewId) || null;
  const application = previewApplicant?.application || {};

  return (
    <Page
      title={intl.formatMessage({ id: 'AdminVenuesPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSideNavigation
        topbar={<TopbarContainer />}
        sideNav={<AdminNav currentPage="AdminVenuesPage" />}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <DashboardHeader
            eyebrowId="AdminVenuesPage.eyebrow"
            titleId="AdminVenuesPage.title"
            subtitleId="AdminVenuesPage.subtitle"
          />

          <ReviewFilterNav currentStatus={currentStatus} pageName="AdminVenuesPage" />

          {decisionError ? (
            <p className={css.error}>
              <FormattedMessage id="ReviewQueue.decisionFailed" />
            </p>
          ) : null}

          {queryError ? (
            <div className={css.messagePanel}>
              <H3 as="h2">
                <FormattedMessage id="ReviewQueue.queryFailed" />
              </H3>
              <p className={css.messageBody}>
                <FormattedMessage id="ReviewQueue.queryFailedBody" />
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
              emptyMessageId="AdminVenuesPage.empty"
            />
          )}

          <ReviewPreviewPanel
            id="AdminVenuesPage.previewPanel"
            isOpen={!!previewApplicant}
            onClose={() => setPreviewId(null)}
            onManageDisableScrolling={onManageDisableScrolling}
            titleId="AdminVenuesPage.applicationTitle"
            status={previewApplicant?.approvalState}
            name={previewApplicant?.name}
            metaText={
              [previewApplicant?.venueType, previewApplicant?.neighborhood]
                .filter(Boolean)
                .join(' · ') || null
            }
            imageUrl={application.photoUrl || previewApplicant?.photoUrl}
            inProgress={!!previewApplicant && decisionInProgressId === previewApplicant.id}
            onApprove={() => onApprove(previewApplicant.id)}
            onReject={reason => onReject(previewApplicant.id, reason)}
          >
            {/*
              Field names follow the design's venue application. svc has not pinned the
              per-applicant payload, so every section is optional and collapses when the
              key is absent — confirm the real shape once Domain 8 ships.
            */}
            <PanelSection labelId="AdminVenuesPage.panelAddress">
              {application.address}
            </PanelSection>
            <PanelSection labelId="AdminVenuesPage.panelAbout">
              {application.description || previewApplicant?.description}
            </PanelSection>
            <PanelSection labelId="AdminVenuesPage.panelCapacity">
              {previewApplicant?.capacity ?? application.capacity}
            </PanelSection>
            <PanelSection labelId="AdminVenuesPage.panelAgePolicy">
              {application.agePolicy}
            </PanelSection>
            <PanelSection labelId="AdminVenuesPage.panelAlcoholPolicy">
              {application.alcoholPolicy}
            </PanelSection>
            <PanelSection labelId="AdminVenuesPage.panelMaterialsProvided">
              <PanelChips items={application.materialsProvided} />
            </PanelSection>
            <PanelSection labelId="AdminVenuesPage.panelMaterialsNotAllowed">
              <PanelChips items={application.materialsNotAllowed} />
            </PanelSection>
            <PanelSection labelId="AdminVenuesPage.panelEventTypes">
              <PanelChips items={application.eventTypes} />
            </PanelSection>
            <PanelSection labelId="AdminVenuesPage.panelContact">
              {[application.contactName, application.contactEmail].filter(Boolean).join(' · ') ||
                null}
            </PanelSection>
            <PanelSection labelId="ReviewQueue.panelApplied">
              {formatApplied(previewApplicant?.appliedAt)}
            </PanelSection>
          </ReviewPreviewPanel>
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
  } = state.AdminVenuesPage;

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
  // Required by Modal inside ReviewPreviewPanel.
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

const AdminVenuesPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(AdminVenuesPageComponent);

export default AdminVenuesPage;
