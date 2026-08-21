import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { createUser, fakeIntl } from '../../util/testData';

import { AdminOverviewPageComponent } from './AdminOverviewPage';

const { screen } = testingLibrary;

const adminUser = createUser('adminUser', {
  profile: { displayName: 'Admin', abbreviatedName: 'A', publicData: { isAdmin: true } },
});

const nonAdminUser = createUser('plainUser', {
  profile: { displayName: 'Plain', abbreviatedName: 'P', publicData: {} },
});

const baseProps = {
  currentUser: adminUser,
  pendingTeachers: [],
  pendingVenues: [],
  teacherCount: { count: 9, isCapped: false },
  venueCount: { count: 3, isCapped: false },
  approvalsInProgress: false,
  approvalsFailed: false,
  activeClasses: 4,
  activeClassesInProgress: false,
  scrollingDisabled: false,
  intl: fakeIntl,
};

describe('AdminOverviewPage', () => {
  it('shows the three figures that have a real data source', () => {
    render(<AdminOverviewPageComponent {...baseProps} />);

    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  // The whole point of the unavailable treatment: bookings, revenue and commission must
  // never render as a number, because no endpoint can produce one.
  it('marks bookings, revenue and commission as needing backend support', () => {
    render(<AdminOverviewPageComponent {...baseProps} />);

    expect(screen.getAllByText('AdminOverviewPage.needsBackend')).toHaveLength(3);
  });

  it('does not render the design\'s sample booking figures', () => {
    render(<AdminOverviewPageComponent {...baseProps} />);

    // Seed values from the Lovable prototype. If these ever appear, someone has wired
    // placeholder numbers into an admin page.
    expect(screen.queryByText('28')).not.toBeInTheDocument();
    expect(screen.queryByText(/3,240/)).not.toBeInTheDocument();
    expect(screen.queryByText(/486/)).not.toBeInTheDocument();
  });

  it('lists pending applications with a review link', () => {
    render(
      <AdminOverviewPageComponent
        {...baseProps}
        pendingTeachers={[
          { id: 'u1', name: 'Elena Vasquez', discipline: 'Bookbinding', appliedAt: '2026-07-24' },
        ]}
        pendingVenues={[{ id: 'v1', name: 'The Lot Annex', venueType: 'Restaurant' }]}
      />
    );

    expect(screen.getByText('Elena Vasquez')).toBeInTheDocument();
    expect(screen.getByText('The Lot Annex')).toBeInTheDocument();
    expect(screen.getAllByText('AdminOverviewPage.review')).toHaveLength(2);
  });

  it('counts only the queues that loaded', () => {
    render(
      <AdminOverviewPageComponent
        {...baseProps}
        pendingTeachers={[{ id: 'u1', name: 'Elena Vasquez' }]}
        // Failed to load — must not be counted as zero.
        pendingVenues={null}
      />
    );

    expect(screen.getByText('AdminOverviewPage.waitingPartial')).toBeInTheDocument();
    expect(screen.queryByText('AdminOverviewPage.waiting')).not.toBeInTheDocument();
  });

  // An empty queue and an unreachable backend must not look the same.
  it('distinguishes an empty queue from a failed one', () => {
    render(<AdminOverviewPageComponent {...baseProps} pendingVenues={null} />);

    expect(screen.getByText('AdminOverviewPage.noTeacherApplications')).toBeInTheDocument();
    expect(screen.getByText('AdminOverviewPage.sectionUnavailable')).toBeInTheDocument();
  });

  it('warns when a count is only one page of results', () => {
    render(
      <AdminOverviewPageComponent {...baseProps} teacherCount={{ count: 20, isCapped: true }} />
    );

    expect(screen.getByText('AdminOverviewPage.countsCapped')).toBeInTheDocument();
  });

  it('shows an error when every approvals call failed', () => {
    render(
      <AdminOverviewPageComponent
        {...baseProps}
        approvalsFailed
        pendingTeachers={null}
        pendingVenues={null}
        teacherCount={null}
        venueCount={null}
      />
    );

    expect(screen.getByText('AdminOverviewPage.approvalsUnavailable')).toBeInTheDocument();
  });

  it('does not render the overview for a non-admin user', () => {
    render(<AdminOverviewPageComponent {...baseProps} currentUser={nonAdminUser} />);

    expect(screen.queryByText('AdminOverviewPage.pendingApprovals')).not.toBeInTheDocument();
  });
});
