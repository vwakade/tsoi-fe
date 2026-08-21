import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { createUser, fakeIntl } from '../../util/testData';

import { AdminVenuesPageComponent } from './AdminVenuesPage';

const { screen } = testingLibrary;

const adminUser = createUser('adminUser', {
  profile: { displayName: 'Admin', abbreviatedName: 'A', publicData: { isAdmin: true } },
});

const nonAdminUser = createUser('plainUser', {
  profile: { displayName: 'Plain', abbreviatedName: 'P', publicData: {} },
});

const pendingVenue = {
  id: 'venue-1',
  name: 'The Kiln Room',
  venueType: 'Studio',
  neighborhood: 'North Park',
  capacity: 12,
  approvalState: 'pending',
  appliedAt: '2026-06-01T10:00:00.000Z',
};

const approvedVenue = {
  id: 'venue-2',
  name: 'Harbour Loft',
  venueType: 'Event space',
  neighborhood: 'Little Italy',
  capacity: 40,
  approvalState: 'approved',
  appliedAt: '2026-05-20T10:00:00.000Z',
};

const baseProps = {
  currentUser: adminUser,
  queryInProgress: false,
  queryError: null,
  decisionInProgressId: null,
  decisionError: null,
  onApprove: () => {},
  onReject: () => {},
  onManageDisableScrolling: () => {},
  scrollingDisabled: false,
  intl: fakeIntl,
};

describe('AdminVenuesPage', () => {
  it('lists venue applications with their status', () => {
    render(<AdminVenuesPageComponent {...baseProps} applicants={[pendingVenue]} />);

    expect(screen.getByText('The Kiln Room')).toBeInTheDocument();
    expect(screen.getByText('Studio')).toBeInTheDocument();
    expect(screen.getByText('North Park')).toBeInTheDocument();
    // Wire value is lowercase; the badge renders a translated label key.
    expect(screen.getByText('StatusBadge.pending')).toBeInTheDocument();
  });

  it('offers approve and reject on a pending row', () => {
    render(<AdminVenuesPageComponent {...baseProps} applicants={[pendingVenue]} />);

    expect(screen.getByText('ReviewQueue.approve')).toBeInTheDocument();
    expect(screen.getByText('ReviewQueue.reject')).toBeInTheDocument();
  });

  it('offers no decision actions on a terminal row, since both decisions are final', () => {
    render(<AdminVenuesPageComponent {...baseProps} applicants={[approvedVenue]} />);

    expect(screen.getByText('StatusBadge.approved')).toBeInTheDocument();
    expect(screen.queryByText('ReviewQueue.approve')).not.toBeInTheDocument();
    expect(screen.queryByText('ReviewQueue.reject')).not.toBeInTheDocument();
    // Preview stays available on terminal rows.
    expect(screen.getByText('ReviewQueue.preview')).toBeInTheDocument();
  });

  it('never renders suspend or reinstate — svc does not provide them', () => {
    render(<AdminVenuesPageComponent {...baseProps} applicants={[pendingVenue, approvedVenue]} />);

    expect(screen.queryByText(/suspend/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reinstate/i)).not.toBeInTheDocument();
  });

  it('has no Source column — the teacher-provided queue has no endpoint', () => {
    render(<AdminVenuesPageComponent {...baseProps} applicants={[pendingVenue]} />);

    expect(screen.queryByText('AdminVenuesPage.columnSource')).not.toBeInTheDocument();
    expect(screen.queryByText(/teacher-provided/i)).not.toBeInTheDocument();
  });

  it('renders an empty state when the queue is clear', () => {
    render(<AdminVenuesPageComponent {...baseProps} applicants={[]} />);

    expect(screen.getByText('AdminVenuesPage.empty')).toBeInTheDocument();
  });

  it('shows an error state instead of the table when the query failed', () => {
    render(
      <AdminVenuesPageComponent
        {...baseProps}
        applicants={[]}
        queryError={{ status: 502, message: 'nope' }}
      />
    );

    expect(screen.getByText('ReviewQueue.queryFailed')).toBeInTheDocument();
    expect(screen.queryByText('AdminVenuesPage.empty')).not.toBeInTheDocument();
  });

  it('does not render the queue for a non-admin user', () => {
    render(
      <AdminVenuesPageComponent
        {...baseProps}
        currentUser={nonAdminUser}
        applicants={[pendingVenue]}
      />
    );

    expect(screen.queryByText('The Kiln Room')).not.toBeInTheDocument();
  });
});
