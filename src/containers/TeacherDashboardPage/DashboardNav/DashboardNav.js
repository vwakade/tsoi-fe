import React from 'react';

import { useIntl } from '../../../util/reactIntl';
import { TabNav } from '../../../components';

import css from './DashboardNav.module.css';

/**
 * Side rail for the teacher dashboard.
 *
 * Selected state comes from the route `name`, not location.pathname — route names are
 * stable, pathnames are not.
 *
 * The design's rail also lists Followers and Following. Both are omitted until the
 * follow backend ships: linking to pages that do not exist is how a "page not found"
 * reaches a user who did nothing wrong.
 *
 * @component
 * @param {Object} props
 * @param {string} props.currentPage route name of the active page
 * @param {string} [props.className]
 * @returns {JSX.Element}
 */
const DashboardNav = props => {
  const { currentPage, className } = props;
  const intl = useIntl();

  const tabs = [
    {
      text: intl.formatMessage({ id: 'DashboardNav.overview' }),
      selected: currentPage === 'TeacherDashboardPage',
      linkProps: { name: 'TeacherDashboardPage' },
    },
    {
      text: intl.formatMessage({ id: 'DashboardNav.listings' }),
      selected: currentPage === 'ManageListingsPage',
      linkProps: { name: 'ManageListingsPage' },
    },
    {
      text: intl.formatMessage({ id: 'DashboardNav.settings' }),
      selected: currentPage === 'ProfileSettingsPage',
      linkProps: { name: 'ProfileSettingsPage' },
    },
  ];

  return (
    <div className={className || css.root}>
      <div className={css.heading}>{intl.formatMessage({ id: 'DashboardNav.heading' })}</div>
      <TabNav
        rootClassName={css.tabs}
        tabRootClassName={css.tab}
        tabs={tabs}
        ariaLabel={intl.formatMessage({ id: 'DashboardNav.screenreader.nav' })}
      />
    </div>
  );
};

export default DashboardNav;
