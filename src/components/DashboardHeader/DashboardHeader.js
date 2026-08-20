import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { H1 } from '../../components';

import css from './DashboardHeader.module.css';

/**
 * Eyebrow + title + optional subtitle. Shared by the admin queues and the role
 * dashboards, which all open the same way.
 *
 * @component
 * @param {Object} props
 * @param {string} props.eyebrowId translation id for the small uppercase label
 * @param {string} props.titleId translation id for the page title
 * @param {Object} [props.titleValues] values interpolated into the title message
 * @param {string} [props.subtitleId] translation id for the supporting line
 * @param {string} [props.className] extends the root class
 * @returns {JSX.Element}
 */
const DashboardHeader = props => {
  const { eyebrowId, titleId, titleValues, subtitleId, className } = props;

  return (
    <div className={classNames(css.root, className)}>
      <span className={css.eyebrow}>
        <FormattedMessage id={eyebrowId} />
      </span>
      <H1 className={css.title}>
        <FormattedMessage id={titleId} values={titleValues} />
      </H1>
      {subtitleId ? (
        <p className={css.subtitle}>
          <FormattedMessage id={subtitleId} />
        </p>
      ) : null}
    </div>
  );
};

export default DashboardHeader;
