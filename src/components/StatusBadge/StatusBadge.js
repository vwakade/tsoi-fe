import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';

import css from './StatusBadge.module.css';

// Wire values are lowercase (svc contract). The capitalized forms are display labels
// only, produced through react-intl below — never compare against them.
//
// 'suspended' is mapped even though nothing produces it today: svc provides approve
// and reject only, and the approvalState enum has three values. Keeping the tone here
// costs nothing if the vocabulary later grows.
const TONE_BY_STATUS = {
  approved: css.toneSuccess,
  published: css.toneSuccess,
  confirmed: css.toneSuccess,
  pending: css.toneAttention,
  rejected: css.toneFail,
  suspended: css.toneFail,
  cancelled: css.toneFail,
  declined: css.toneFail,
  refunded: css.toneNeutral,
  completed: css.toneNeutral,
  expired: css.toneNeutral,
};

/**
 * A status pill. Maps a lowercase status to a tone and a translated label.
 *
 * Unknown statuses render with the neutral tone and the raw value, rather than
 * throwing — a new status from the backend should look odd, not break the page.
 *
 * @component
 * @param {Object} props
 * @param {string} props.status lowercase status, e.g. 'pending'
 * @param {string} [props.className] extends the root class
 * @returns {JSX.Element|null} null when no status is given
 */
const StatusBadge = props => {
  const { status, className } = props;

  if (!status) {
    return null;
  }

  const normalized = String(status).toLowerCase();
  const tone = TONE_BY_STATUS[normalized] || css.toneNeutral;
  const isKnown = !!TONE_BY_STATUS[normalized];

  return (
    <span className={classNames(css.root, tone, className)}>
      {isKnown ? (
        <FormattedMessage id={`StatusBadge.${normalized}`} defaultMessage={normalized} />
      ) : (
        normalized
      )}
    </span>
  );
};

export default StatusBadge;
