import React, { useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';

import { InlineTextButton, PrimaryButton, SecondaryButton } from '../../components';

import css from './ReviewRowActions.module.css';

/**
 * Preview / approve / reject controls for one row of an admin review queue.
 *
 * Reject is two-step: approve and reject are both terminal — svc has no reinstate — so a
 * single click must not fire an irreversible decision.
 *
 * Approved and rejected rows keep only the preview action, and say so explicitly rather
 * than leaving an unexplained gap in the actions column.
 *
 * @component
 * @param {Object} props
 * @param {string} props.status lowercase approval state, e.g. 'pending'
 * @param {boolean} [props.inProgress] whether this row's decision is in flight
 * @param {Function} props.onApprove called with no arguments
 * @param {Function} props.onReject called with no arguments
 * @param {Function} props.onPreview opens the preview drawer
 * @param {string} [props.className] extends the root class
 * @returns {JSX.Element}
 */
const ReviewRowActions = props => {
  const { status, inProgress, onApprove, onReject, onPreview, className } = props;
  const [confirmingReject, setConfirmingReject] = useState(false);

  const isPending = status === 'pending';

  const decisionControls = !isPending ? (
    <span className={css.terminalNote}>
      <FormattedMessage id="ReviewQueue.noActions" />
    </span>
  ) : confirmingReject ? (
    <>
      <SecondaryButton
        className={classNames(css.actionButton, css.destructiveButton)}
        inProgress={inProgress}
        onClick={onReject}
      >
        <FormattedMessage id="ReviewQueue.confirmReject" />
      </SecondaryButton>
      <InlineTextButton className={css.cancelButton} onClick={() => setConfirmingReject(false)}>
        <FormattedMessage id="ReviewQueue.cancel" />
      </InlineTextButton>
    </>
  ) : (
    <>
      <PrimaryButton className={css.actionButton} inProgress={inProgress} onClick={onApprove}>
        <FormattedMessage id="ReviewQueue.approve" />
      </PrimaryButton>
      <SecondaryButton
        className={classNames(css.actionButton, css.destructiveButton)}
        disabled={inProgress}
        onClick={() => setConfirmingReject(true)}
      >
        <FormattedMessage id="ReviewQueue.reject" />
      </SecondaryButton>
    </>
  );

  return (
    <div className={classNames(css.root, className)}>
      {/* The name cell also opens the drawer; this is the discoverable version. */}
      <InlineTextButton className={css.previewButton} onClick={onPreview}>
        <FormattedMessage id="ReviewQueue.preview" />
      </InlineTextButton>
      {decisionControls}
    </div>
  );
};

export default ReviewRowActions;
