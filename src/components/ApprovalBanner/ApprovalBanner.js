import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink } from '../../components';

import css from './ApprovalBanner.module.css';

/**
 * Tells a provider where their application stands.
 *
 * Approval state lives in Sharetribe metadata, which is operator-only — the provider's
 * own session cannot read it off their profile, so it comes from svc. See
 * `server/api/svc/approval-status.js`.
 *
 * The wording matters: **approval gates publishing, not creating**. A pending provider
 * can build drafts and cannot publish them. Saying "you're blocked" would be wrong and
 * would turn the pending state into a dead end, so the pending banner points at listing
 * creation rather than hiding it.
 *
 * Teachers and venue owners follow the same approval flow (svc keys approvals by user
 * with `role=teacher|venue`), so this takes a `role` and selects its copy from that.
 *
 * @component
 * @param {Object} props
 * @param {'teacher'|'venue'} props.role whose application this is, selects the copy
 * @param {string} [props.approvalState] 'pending' | 'approved' | 'rejected'
 * @param {boolean} [props.inProgress] whether the status request is in flight
 * @param {Object} [props.error] error from the status request
 * @param {string} [props.className]
 * @returns {JSX.Element|null} null once approved — an approved provider needs no notice
 */
const ApprovalBanner = props => {
  const { role, approvalState, inProgress, error, className } = props;

  // Say nothing while we don't know. A banner that flickers "pending" before resolving
  // to "approved" is worse than a brief absence.
  if (inProgress) {
    return null;
  }

  if (error) {
    return (
      <div className={classNames(css.root, css.neutral, className)}>
        <p className={css.body}>
          <FormattedMessage id="ApprovalBanner.statusUnavailable" />
        </p>
      </div>
    );
  }

  // Approved is the steady state — no banner.
  if (!approvalState || approvalState === 'approved') {
    return null;
  }

  if (approvalState === 'rejected') {
    return (
      <div className={classNames(css.root, css.rejected, className)}>
        <h2 className={css.title}>
          <FormattedMessage id={'ApprovalBanner.' + role + 'RejectedTitle'} />
        </h2>
        <p className={css.body}>
          <FormattedMessage id={'ApprovalBanner.' + role + 'RejectedBody'} />
        </p>
      </div>
    );
  }

  return (
    <div className={classNames(css.root, css.pending, className)}>
      <h2 className={css.title}>
        <FormattedMessage id={'ApprovalBanner.' + role + 'PendingTitle'} />
      </h2>
      <p className={css.body}>
        <FormattedMessage id={'ApprovalBanner.' + role + 'PendingBody'} />
      </p>
      <NamedLink name="NewListingPage" className={css.action}>
        <FormattedMessage id={'ApprovalBanner.' + role + 'PendingAction'} />
      </NamedLink>
    </div>
  );
};

export default ApprovalBanner;
