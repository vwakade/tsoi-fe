import React from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { NamedLink } from '../../components';

import css from './AdminNav.module.css';

/**
 * Rail icons.
 *
 * The design uses lucide-react, which is not a dependency here. These are minimal
 * stand-ins at the same 16px stroked weight, kept local because nothing else needs them.
 */
const Icon = ({ shape }) => {
  const paths = {
    overview: <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" />,
    users: <path d="M6 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.5 14v-1a3 3 0 013-3h3a3 3 0 013 3v1M12 6h3" />,
    building: <path d="M3 14V3a1 1 0 011-1h6a1 1 0 011 1v11M5.5 5h1M9 5h1M5.5 8h1M9 8h1M6.5 14v-3h3v3" />,
    calendar: <path d="M2.5 4h11v10h-11zM2.5 7h11M5.5 2v3M10.5 2v3" />,
    ticket: <path d="M1.5 6.5V4h13v2.5a1.5 1.5 0 000 3V12h-13V9.5a1.5 1.5 0 000-3zM8 4v8" />,
    settings: <path d="M8 10a2 2 0 100-4 2 2 0 000 4zM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" />,
  };

  return (
    <svg
      className={css.icon}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[shape]}
    </svg>
  );
};

/**
 * All seven rail entries from the design, in design order. Every one is a real route.
 *
 * Three of them (Teacher venues, Bookings, Settings) have no backend yet and land on
 * AdminPlaceholderPage, which explains what is missing. They are navigable rather than
 * inert so the section behaves like the design; the honesty lives on the page itself
 * rather than in a disabled link nobody can read.
 */
const NAV_ITEMS = [
  { key: 'overview', icon: 'overview', routeName: 'AdminOverviewPage' },
  { key: 'teachers', icon: 'users', routeName: 'AdminTeachersPage' },
  { key: 'venues', icon: 'building', routeName: 'AdminVenuesPage' },
  { key: 'teacherVenues', icon: 'building', routeName: 'AdminTeacherVenuesPage' },
  { key: 'classes', icon: 'calendar', routeName: 'AdminClassesPage' },
  { key: 'bookings', icon: 'ticket', routeName: 'AdminBookingsPage' },
  { key: 'settings', icon: 'settings', routeName: 'AdminSettingsPage' },
];

/**
 * Side rail for the admin section.
 *
 * Hand-rolled rather than using the shared `TabNav` so it can carry the design's icons
 * and the "ADMIN" heading above the list.
 *
 * Selected state comes from the route `name`, not `location.pathname` — route names are
 * stable, pathnames are not.
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

  return (
    <nav
      className={classNames(css.root, className)}
      aria-label={intl.formatMessage({ id: 'AdminNav.screenreader.nav' })}
    >
      <div className={css.heading}>
        <FormattedMessage id="AdminNav.heading" />
      </div>

      <ul className={css.items}>
        {NAV_ITEMS.map(({ key, icon, routeName }) => (
          <li key={key}>
            <NamedLink
              name={routeName}
              className={classNames(css.item, {
                [css.itemSelected]: currentPage === routeName,
              })}
            >
              <Icon shape={icon} />
              <FormattedMessage id={`AdminNav.${key}`} />
            </NamedLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default AdminNav;
