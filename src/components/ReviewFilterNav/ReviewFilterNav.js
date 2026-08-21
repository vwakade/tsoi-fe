import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { FILTER_VALUES } from '../../util/approvalQueue';

import { NamedLink } from '../../components';

import css from './ReviewFilterNav.module.css';

/**
 * Status filter pills for an admin review queue.
 *
 * The pills are links, not buttons: filter state belongs in the URL so it survives a
 * refresh, can be shared, and is readable by `loadData` for SSR. That also keeps them
 * right-clickable and the back button honest.
 *
 * There is no `Suspended` pill — svc has no suspend or reinstate, so it would never
 * match anything.
 *
 * @component
 * @param {Object} props
 * @param {string} props.currentStatus the active filter, e.g. 'pending'
 * @param {string} props.pageName route name to link to, e.g. 'AdminVenuesPage'
 * @param {string} [props.className] extends the root class
 * @returns {JSX.Element}
 */
const ReviewFilterNav = props => {
  const { currentStatus = 'all', pageName, className } = props;

  return (
    <nav className={classNames(css.root, className)}>
      {FILTER_VALUES.map(value => (
        <NamedLink
          key={value}
          name={pageName}
          to={{ search: value === 'all' ? '' : `?status=${value}` }}
          className={value === currentStatus ? css.pillSelected : css.pill}
        >
          <FormattedMessage id={`ReviewQueue.filter_${value}`} />
        </NamedLink>
      ))}
    </nav>
  );
};

export default ReviewFilterNav;
