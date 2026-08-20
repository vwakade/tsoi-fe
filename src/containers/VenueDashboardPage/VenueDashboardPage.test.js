import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { createUser, fakeIntl } from '../../util/testData';

import { VenueDashboardPageComponent } from './VenueDashboardPage';

const { screen } = testingLibrary;

const venueOwner = createUser('venue1', {
  profile: {
    displayName: 'North Park Brewing',
    abbreviatedName: 'NP',
    publicData: { userType: 'venue' },
  },
});

const student = createUser('student1', {
  profile: { displayName: 'Maya', abbreviatedName: 'M', publicData: { userType: 'student' } },
});

const baseProps = {
  currentUser: venueOwner,
  approvalState: 'approved',
  approvalInProgress: false,
  approvalError: null,
  scrollingDisabled: false,
  intl: fakeIntl,
};

describe('VenueDashboardPage', () => {
  it('links into the existing template pages rather than reimplementing them', () => {
    render(<VenueDashboardPageComponent {...baseProps} />);

    expect(screen.getByText('VenueDashboardPage.link_requests')).toBeInTheDocument();
    expect(screen.getByText('VenueDashboardPage.link_listings')).toBeInTheDocument();
    expect(screen.getByText('VenueDashboardPage.link_profile')).toBeInTheDocument();
  });

  it('shows no approval banner once approved', () => {
    render(<VenueDashboardPageComponent {...baseProps} approvalState="approved" />);

    expect(screen.queryByText('ApprovalBanner.venuePendingTitle')).not.toBeInTheDocument();
    expect(screen.queryByText('ApprovalBanner.venueRejectedTitle')).not.toBeInTheDocument();
  });

  it('tells a pending venue owner they can draft but not publish, and points at creating one', () => {
    render(<VenueDashboardPageComponent {...baseProps} approvalState="pending" />);

    expect(screen.getByText('ApprovalBanner.venuePendingTitle')).toBeInTheDocument();
    // Approval gates publishing, not creating — the pending state must not be a dead end.
    expect(screen.getByText('ApprovalBanner.venuePendingAction')).toBeInTheDocument();
  });

  it('shows the rejected banner when rejected', () => {
    render(<VenueDashboardPageComponent {...baseProps} approvalState="rejected" />);

    expect(screen.getByText('ApprovalBanner.venueRejectedTitle')).toBeInTheDocument();
  });

  it('stays quiet while the status is still loading, rather than flashing "pending"', () => {
    render(
      <VenueDashboardPageComponent {...baseProps} approvalState={null} approvalInProgress={true} />
    );

    expect(screen.queryByText('ApprovalBanner.venuePendingTitle')).not.toBeInTheDocument();
    expect(screen.queryByText('ApprovalBanner.statusUnavailable')).not.toBeInTheDocument();
  });

  it('degrades to a notice when svc cannot be reached, without failing the page', () => {
    render(
      <VenueDashboardPageComponent
        {...baseProps}
        approvalState={null}
        approvalError={{ status: 502 }}
      />
    );

    expect(screen.getByText('ApprovalBanner.statusUnavailable')).toBeInTheDocument();
    // The rest of the hub still renders.
    expect(screen.getByText('VenueDashboardPage.link_listings')).toBeInTheDocument();
  });

  it('does not render the hub for a non-venue user', () => {
    render(<VenueDashboardPageComponent {...baseProps} currentUser={student} />);

    expect(screen.queryByText('VenueDashboardPage.link_listings')).not.toBeInTheDocument();
  });
});
