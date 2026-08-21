import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { createUser, fakeIntl } from '../../util/testData';

import { AdminPlaceholderPageComponent } from './AdminPlaceholderPage';

const { screen } = testingLibrary;

const adminUser = createUser('adminUser', {
  profile: { displayName: 'Admin', abbreviatedName: 'A', publicData: { isAdmin: true } },
});

const nonAdminUser = createUser('plainUser', {
  profile: { displayName: 'Plain', abbreviatedName: 'P', publicData: {} },
});

const baseProps = {
  currentUser: adminUser,
  scrollingDisabled: false,
  intl: fakeIntl,
};

describe('AdminPlaceholderPage', () => {
  it.each(['teacherVenues', 'bookings', 'settings'])(
    'explains why the %s section has no data yet',
    section => {
      render(<AdminPlaceholderPageComponent {...baseProps} section={section} />);

      expect(screen.getByText('AdminPlaceholderPage.notAvailableTitle')).toBeInTheDocument();
      expect(screen.getByText(`AdminPlaceholderPage.${section}.reason`)).toBeInTheDocument();
    }
  );

  it('offers the venues queue as the nearest thing for teacher venues', () => {
    render(<AdminPlaceholderPageComponent {...baseProps} section="teacherVenues" />);

    expect(screen.getByText('AdminPlaceholderPage.teacherVenues.related')).toBeInTheDocument();
  });

  it('offers no onward link where there is no related page', () => {
    render(<AdminPlaceholderPageComponent {...baseProps} section="bookings" />);

    expect(screen.queryByText('AdminPlaceholderPage.bookings.related')).not.toBeInTheDocument();
  });

  // A typo in a route's extraProps would otherwise render a page of blank messages.
  it('redirects rather than rendering an unknown section', () => {
    render(<AdminPlaceholderPageComponent {...baseProps} section="nope" />);

    expect(screen.queryByText('AdminPlaceholderPage.notAvailableTitle')).not.toBeInTheDocument();
  });

  it('does not render for a non-admin user', () => {
    render(
      <AdminPlaceholderPageComponent
        {...baseProps}
        section="bookings"
        currentUser={nonAdminUser}
      />
    );

    expect(screen.queryByText('AdminPlaceholderPage.notAvailableTitle')).not.toBeInTheDocument();
  });
});
