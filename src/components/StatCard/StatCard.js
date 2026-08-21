import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { H2 } from '../../components';

import css from './StatCard.module.css';

/**
 * A single figure with a label, as used on the role dashboards.
 *
 * While `inProgress` it shows a placeholder rather than a zero: a dashboard that
 * flashes 0 reads as "you have nothing" instead of "not loaded yet", which is the
 * most common bug on these pages.
 *
 * @component
 * @param {Object} props
 * @param {string} props.labelId translation id for the label
 * @param {number|string} [props.value] the figure to show
 * @param {boolean} [props.inProgress] whether the value is still loading
 * @param {boolean} [props.accent] colour the value with the marketplace colour
 * @param {string} [props.unavailableId] translation id explaining that this figure has
 *   no data source yet. Renders instead of a value, and deliberately not as a large
 *   number — an em-dash alone reads as "still loading", which this is not.
 * @param {string} [props.className]
 * @returns {JSX.Element}
 */
const StatCard = props => {
  const { labelId, value, inProgress, accent, unavailableId, className } = props;
  const hasValue = value !== null && value !== undefined;

  return (
    <div className={classNames(css.root, className)}>
      <span className={css.label}>
        <FormattedMessage id={labelId} />
      </span>
      {unavailableId ? (
        <span className={css.unavailable}>
          <FormattedMessage id={unavailableId} />
        </span>
      ) : (
        <H2 className={classNames(css.value, { [css.accent]: accent })}>
          {inProgress || !hasValue ? <span className={css.placeholder}>&mdash;</span> : value}
        </H2>
      )}
    </div>
  );
};

export default StatCard;
