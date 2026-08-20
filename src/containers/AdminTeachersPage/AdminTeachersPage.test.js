import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { createUser, fakeIntl } from '../../util/testData';

import { AdminTeachersPageComponent } from './AdminTeachersPage';

const { screen } = testingLibrary;

const adminUser = createUser('adminUser', {
  profile: { displayName: 'Admin', abbreviatedName: 'A', publicData: { isAdmin: true } },
});

const nonAdminUser = createUser('plainUser', {
  profile: { displayName: 'Plain', abbreviatedName: 'P', publicData: {} },
});

const pendingApplicant = {
  id: 'user-1',
  name: 'Jordan Lee',
  discipline: 'Watercolor',
  location: 'San Diego, CA',
  approvalState: 'pending',
  appliedAt: '2026-05-14T10:00:00.000Z',
};

const approvedApplicant = {
  id: 'user-2',
  name: 'Maren Olsen',
  discipline: 'Ceramics',
  approvalState: 'approved',
  appliedAt: '2026-05-02T10:00:00.000Z',
};

const baseProps = {
  currentUser: adminUser,
  queryInProgress: false,
  queryError: null,
  decisionInProgressId: null,
  decisionError: null,
  onApprove: () => {},
  onReject: () => {},
  scrollingDisabled: false,
  intl: fakeIntl,
};

describe('AdminTeachersPage', () => {
  it('lists applicants with their status', () => {
    render(<AdminTeachersPageComponent {...baseProps} applicants={[pendingApplicant]} />);

    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByText('Watercolor')).toBeInTheDocument();
    // Wire value is lowercase; the badge renders a translated label key.
    expect(screen.getByText('StatusBadge.pending')).toBeInTheDocument();
  });

  it('offers approve and reject on a pending row', () => {
    render(<AdminTeachersPageComponent {...baseProps} applicants={[pendingApplicant]} />);

    expect(screen.getByText('AdminTeachersPage.approve')).toBeInTheDocument();
    expect(screen.getByText('AdminTeachersPage.reject')).toBeInTheDocument();
  });

  it('offers no actions on a terminal row, since approve and reject are irreversible', () => {
    render(<AdminTeachersPageComponent {...baseProps} applicants={[approvedApplicant]} />);

    expect(screen.getByText('StatusBadge.approved')).toBeInTheDocument();
    expect(screen.queryByText('AdminTeachersPage.approve')).not.toBeInTheDocument();
    expect(screen.queryByText('AdminTeachersPage.reject')).not.toBeInTheDocument();
  });

  it('never renders suspend or reinstate — svc does not provide them', () => {
    render(
      <AdminTeachersPageComponent
        {...baseProps}
        applicants={[pendingApplicant, approvedApplicant]}
      />
    );

    expect(screen.queryByText(/suspend/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reinstate/i)).not.toBeInTheDocument();
  });

  it('renders an empty state when the queue is clear', () => {
    render(<AdminTeachersPageComponent {...baseProps} applicants={[]} />);

    expect(screen.getByText('AdminTeachersPage.empty')).toBeInTheDocument();
  });

  it('shows an error state instead of the table when the query failed', () => {
    render(
      <AdminTeachersPageComponent
        {...baseProps}
        applicants={[]}
        queryError={{ status: 502, message: 'nope' }}
      />
    );

    expect(screen.getByText('AdminTeachersPage.queryFailed')).toBeInTheDocument();
    expect(screen.queryByText('AdminTeachersPage.empty')).not.toBeInTheDocument();
  });

  it('does not render the queue for a non-admin user', () => {
    render(
      <AdminTeachersPageComponent
        {...baseProps}
        currentUser={nonAdminUser}
        applicants={[pendingApplicant]}
      />
    );

    expect(screen.queryByText('Jordan Lee')).not.toBeInTheDocument();
  });
});
