import React from 'react';

import { useIntl } from '../../../util/reactIntl';
import { TabNav } from '../../../components';

import css from './AdminNav.module.css';

/**
 * Side rail for the admin section.
 *
 * Selected state is computed from the route `name`, not location.pathname — route
 * names are stable, pathnames are not.
 *
 * Only the queues that svc actually serves are listed. The design also shows
 * Overview, Teacher venues, Classes, Bookings and Settings; those are omitted until
 * there are endpoints behind them, rather than linking to empty pages.
 *
 * @component
 * @param {Object} props
 * @param {string} props.currentPage route name of the active page
 * @param {string} [props.className]
 * @returns {JSX.Element}
 */
const AdminNav = props => {
  const { currentPage, className } = props;
  const intl = useIntl();

  const tabs = [
    {
      text: intl.formatMessage({ id: 'AdminNav.teachers' }),
      selected: currentPage === 'AdminTeachersPage',
      linkProps: { name: 'AdminTeachersPage' },
    },
  ];

  return (
    <TabNav
      rootClassName={className || css.tabs}
      tabRootClassName={css.tab}
      tabs={tabs}
      ariaLabel={intl.formatMessage({ id: 'AdminNav.screenreader.nav' })}
    />
  );
};

export default AdminNav;
