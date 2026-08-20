import React from 'react';
import classNames from 'classnames';

import css from './StatCardRow.module.css';

/**
 * Grid wrapper for StatCards: one column on mobile, three from --viewportSmall.
 *
 * @component
 * @param {Object} props
 * @param {ReactNode} props.children the StatCards
 * @param {string} [props.className]
 * @returns {JSX.Element}
 */
const StatCardRow = props => {
  const { children, className } = props;
  return <div className={classNames(css.root, className)}>{children}</div>;
};

export default StatCardRow;
