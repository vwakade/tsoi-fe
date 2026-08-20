import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { createUser, fakeIntl } from '../../util/testData';

import { TeacherDashboardPageComponent } from './TeacherDashboardPage';

const { screen } = testingLibrary;

const teacher = createUser('teacher1', {
  profile: {
    firstName: 'Jordan',
    displayName: 'Jordan Lee',
    abbreviatedName: 'JL',
    publicData: { userType: 'teacher' },
  },
});

const student = createUser('student1', {
  profile: { displayName: 'Maya', abbreviatedName: 'M', publicData: { userType: 'student' } },
});

const baseProps = {
  currentUser: teacher,
  approvalState: 'approved',
  approvalInProgress: false,
  approvalError: null,
  scrollingDisabled: false,
  intl: fakeIntl,
};

describe('TeacherDashboardPage', () => {
  it('links into the existing template pages rather than reimplementing them', () => {
    render(<TeacherDashboardPageComponent {...baseProps} />);

    expect(screen.getByText('TeacherDashboardPage.section_bookings')).toBeInTheDocument();
    expect(screen.getByText('TeacherDashboardPage.section_listings')).toBeInTheDocument();
    expect(screen.getByText('TeacherDashboardPage.newListing')).toBeInTheDocument();
  });

  it('shows real counts in the stat row', () => {
    render(
      <TeacherDashboardPageComponent
        {...baseProps}
        stats={{ classesCompleted: 2, upcomingBookings: 9, publishedListings: 4 }}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows a placeholder rather than zeros while counts load', () => {
    render(<TeacherDashboardPageComponent {...baseProps} stats={null} statsInProgress={true} />);

    // A dashboard that flashes 0 reads as "you have nothing" rather than "loading".
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('never shows invented earnings or follower figures', () => {
    render(
      <TeacherDashboardPageComponent
        {...baseProps}
        stats={{ classesCompleted: 2, upcomingBookings: 9, publishedListings: 4 }}
      />
    );

    // Earnings are out of svc scope and cannot be summed safely across paged results;
    // followers are parked. Neither may appear with a made-up number.
    expect(screen.queryByText(/gross revenue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/net payout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/followers/i)).not.toBeInTheDocument();
  });

  it('shows no approval banner once approved', () => {
    render(<TeacherDashboardPageComponent {...baseProps} approvalState="approved" />);

    expect(screen.queryByText('ApprovalBanner.teacherPendingTitle')).not.toBeInTheDocument();
    expect(screen.queryByText('ApprovalBanner.teacherRejectedTitle')).not.toBeInTheDocument();
  });

  it('tells a pending teacher they can draft but not publish, and points at creating one', () => {
    render(<TeacherDashboardPageComponent {...baseProps} approvalState="pending" />);

    expect(screen.getByText('ApprovalBanner.teacherPendingTitle')).toBeInTheDocument();
    // Approval gates publishing, not creating — the pending state must not be a dead end.
    expect(screen.getByText('ApprovalBanner.teacherPendingAction')).toBeInTheDocument();
  });

  it('shows the rejected banner when rejected', () => {
    render(<TeacherDashboardPageComponent {...baseProps} approvalState="rejected" />);

    expect(screen.getByText('ApprovalBanner.teacherRejectedTitle')).toBeInTheDocument();
  });

  it('stays quiet while the status is still loading, rather than flashing "pending"', () => {
    render(
      <TeacherDashboardPageComponent
        {...baseProps}
        approvalState={null}
        approvalInProgress={true}
      />
    );

    expect(screen.queryByText('ApprovalBanner.teacherPendingTitle')).not.toBeInTheDocument();
    expect(screen.queryByText('ApprovalBanner.statusUnavailable')).not.toBeInTheDocument();
  });

  it('degrades to a notice when svc cannot be reached, without failing the page', () => {
    render(
      <TeacherDashboardPageComponent
        {...baseProps}
        approvalState={null}
        approvalError={{ status: 502 }}
      />
    );

    expect(screen.getByText('ApprovalBanner.statusUnavailable')).toBeInTheDocument();
    // The rest of the hub still renders.
    expect(screen.getByText('TeacherDashboardPage.section_listings')).toBeInTheDocument();
  });

  it('does not render the hub for a non-teacher', () => {
    render(<TeacherDashboardPageComponent {...baseProps} currentUser={student} />);

    expect(screen.queryByText('TeacherDashboardPage.section_listings')).not.toBeInTheDocument();
  });
});
