import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';

import { H3, InlineTextButton, Modal, PrimaryButton, SecondaryButton } from '../../components';
import StatusBadge from '../StatusBadge/StatusBadge';

import css from './ReviewPreviewPanel.module.css';

/**
 * A labelled block inside a preview panel body.
 *
 * Renders nothing when it has no children, so a page can list every possible section
 * without guarding each one — the svc contract does not pin which fields an applicant
 * record carries, so most of them are optional in practice.
 *
 * @component
 * @param {Object} props
 * @param {string} props.labelId translation id for the section label
 * @param {ReactNode} props.children section body
 * @returns {JSX.Element|null}
 */
export const PanelSection = props => {
  const { labelId, children } = props;

  const isEmpty =
    children == null ||
    children === '' ||
    children === false ||
    (Array.isArray(children) && children.length === 0);

  if (isEmpty) {
    return null;
  }

  return (
    <div className={css.section}>
      <div className={css.sectionLabel}>
        <FormattedMessage id={labelId} />
      </div>
      <div className={css.sectionBody}>{children}</div>
    </div>
  );
};

/**
 * A pill list, for things like materials provided or welcomed event types.
 *
 * @component
 * @param {Object} props
 * @param {Array<string>} props.items
 * @returns {JSX.Element|null}
 */
export const PanelChips = props => {
  const { items = [] } = props;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={css.chips}>
      {items.map(item => (
        <span key={item} className={css.chip}>
          {item}
        </span>
      ))}
    </div>
  );
};

/**
 * Approve / reject controls, pinned to the bottom of the panel.
 *
 * Reject is two-step. Rejection is irreversible here in a way it was not in the design
 * prototype — there is no reinstate — so a single click must not fire it.
 */
const PanelActions = props => {
  const { status, inProgress, allowRejectReason, onApprove, onReject } = props;
  const intl = useIntl();
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');

  // Approved and rejected are both terminal: there is no suspend and no reinstate, so
  // there is genuinely nothing to do from here. Say so rather than leaving a blank gap.
  if (status !== 'pending') {
    return (
      <div className={css.actions}>
        <span className={css.terminalNote}>
          <FormattedMessage id="ReviewPreviewPanel.noActions" />
        </span>
      </div>
    );
  }

  if (isRejecting) {
    return (
      <div className={css.actions}>
        {allowRejectReason ? (
          <div className={css.reasonField}>
            <label className={css.reasonLabel} htmlFor="reviewPreviewPanelReason">
              <FormattedMessage id="ReviewPreviewPanel.reasonLabel" />
            </label>
            <textarea
              id="reviewPreviewPanelReason"
              className={css.reasonTextarea}
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={intl.formatMessage({ id: 'ReviewPreviewPanel.reasonPlaceholder' })}
            />
          </div>
        ) : null}
        <div className={css.actionsRow}>
          <SecondaryButton
            className={classNames(css.actionButton, css.destructiveButton)}
            inProgress={inProgress}
            onClick={() => onReject(reason.trim() || null)}
          >
            <FormattedMessage id="ReviewPreviewPanel.confirmReject" />
          </SecondaryButton>
          <InlineTextButton className={css.cancelButton} onClick={() => setIsRejecting(false)}>
            <FormattedMessage id="ReviewPreviewPanel.cancel" />
          </InlineTextButton>
        </div>
      </div>
    );
  }

  return (
    <div className={css.actions}>
      <div className={css.actionsRow}>
        <PrimaryButton className={css.actionButton} inProgress={inProgress} onClick={onApprove}>
          <FormattedMessage id="ReviewPreviewPanel.approve" />
        </PrimaryButton>
        <SecondaryButton
          className={classNames(css.actionButton, css.destructiveButton)}
          disabled={inProgress}
          onClick={() => setIsRejecting(true)}
        >
          <FormattedMessage id="ReviewPreviewPanel.reject" />
        </SecondaryButton>
      </div>
    </div>
  );
};

/**
 * Right-hand drawer showing one application in full, with the approve/reject actions.
 *
 * One component serves every review queue: the header and actions are fixed, and the
 * caller supplies the entity-specific body as children (see `PanelSection` /
 * `PanelChips`).
 *
 * Built on `Modal`, which **requires** `onManageDisableScrolling` — wire
 * `manageDisableScrolling` from `ducks/ui.duck` through the page's `mapDispatchToProps`.
 *
 * @component
 * @param {Object} props
 * @param {string} props.id unique modal id
 * @param {boolean} props.isOpen whether the drawer is open
 * @param {Function} props.onClose close handler
 * @param {Function} props.onManageDisableScrolling required by Modal
 * @param {string} props.titleId translation id for the panel title
 * @param {string} props.status lowercase approval state, e.g. 'pending'
 * @param {string} [props.name] entity name, shown large under the title
 * @param {string} [props.metaText] one-line secondary description
 * @param {string} [props.imageUrl] wide header image (venues)
 * @param {string} [props.avatarUrl] round avatar (teachers)
 * @param {boolean} [props.inProgress] whether a decision is in flight
 * @param {boolean} [props.allowRejectReason] show the rejection-reason textarea
 * @param {Function} props.onApprove approve handler
 * @param {Function} props.onReject called with the reason string, or null
 * @param {ReactNode} props.children entity-specific sections
 * @returns {JSX.Element|null} null when onManageDisableScrolling is missing
 */
const ReviewPreviewPanel = props => {
  const {
    id,
    isOpen,
    onClose,
    onManageDisableScrolling,
    titleId,
    status,
    name,
    metaText,
    imageUrl,
    avatarUrl,
    inProgress,
    allowRejectReason = false,
    onApprove,
    onReject,
    children,
  } = props;

  const intl = useIntl();

  // Drop the two-step reject state when the drawer closes, so the next application does
  // not open mid-confirmation. Remounting the actions is simpler than resetting two
  // pieces of state, and the panel is reused across rows rather than one per row.
  const [actionsKey, setActionsKey] = useState(0);
  useEffect(() => {
    if (!isOpen) {
      setActionsKey(key => key + 1);
    }
  }, [isOpen]);

  // Modal calls onManageDisableScrolling unconditionally, so rendering without it
  // throws. Mirrors the guard ManageListingsPage uses for DiscardDraftModal.
  if (!onManageDisableScrolling) {
    return null;
  }

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      containerClassName={css.drawer}
      contentClassName={css.drawerContent}
      usePortal
      closeButtonMessage={intl.formatMessage({ id: 'ReviewPreviewPanel.close' })}
    >
      <div className={css.header}>
        <H3 as="h2" className={css.title}>
          <FormattedMessage id={titleId} />
        </H3>

        {imageUrl ? (
          <div className={css.image}>
            <img src={imageUrl} alt={name || ''} className={css.imageContent} />
          </div>
        ) : null}

        <div className={css.identity}>
          {avatarUrl ? <img src={avatarUrl} alt={name || ''} className={css.avatar} /> : null}
          <div>
            {name ? <div className={css.name}>{name}</div> : null}
            {metaText ? <div className={css.meta}>{metaText}</div> : null}
            <StatusBadge status={status} className={css.badge} />
          </div>
        </div>
      </div>

      <div className={css.body}>{children}</div>

      <PanelActions
        key={actionsKey}
        status={status}
        inProgress={inProgress}
        allowRejectReason={allowRejectReason}
        onApprove={onApprove}
        onReject={onReject}
      />
    </Modal>
  );
};

export default ReviewPreviewPanel;
