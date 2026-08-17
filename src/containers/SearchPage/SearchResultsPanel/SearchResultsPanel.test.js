import React from 'react';
import '@testing-library/jest-dom';

import { getHostedConfiguration, renderWithProviders as render } from '../../../util/testHelpers';
import { createUser, createListing, fakeIntl } from '../../../util/testData';

import SearchResultsPanel from './SearchResultsPanel';

const { screen } = require('@testing-library/react');

// Mirrors the live Console setup: a teacher-profile listing type and the
// marketplace-wide category list.
const getConfig = () => {
  const hostedConfig = getHostedConfiguration();
  return {
    ...hostedConfig,
    categories: {
      categories: [{ name: 'Music', id: 'music' }, { name: 'Crafts', id: 'crafts' }],
    },
    listingTypes: {
      listingTypes: [
        {
          id: 'teacher-profile',
          transactionProcess: { name: 'default-inquiry', alias: 'default-inquiry/release-1' },
          unitType: 'inquiry',
          defaultListingFields: { price: false, images: true },
        },
        {
          id: 'events',
          transactionProcess: { name: 'default-booking', alias: 'default-booking/release-1' },
          unitType: 'fixed',
          defaultListingFields: { price: true, images: true },
        },
      ],
    },
  };
};

const teacherListing = createListing(
  'teacher1',
  { title: 'Art Teaher', publicData: { listingType: 'teacher-profile', categoryLevel1: 'music' } },
  { author: createUser('teacherUser') }
);

const eventListing = createListing(
  'event1',
  { title: 'Wheel Throwing', publicData: { listingType: 'events', categoryLevel1: 'crafts' } },
  { author: createUser('eventUser') }
);

describe('SearchResultsPanel', () => {
  it('shows the category label as an overline for a teacher-profile listing', () => {
    render(<SearchResultsPanel listings={[teacherListing]} intl={fakeIntl} />, {
      config: getConfig(),
    });

    expect(screen.getByText('Art Teaher')).toBeInTheDocument();
    // Category id 'music' resolves to the Console-authored label.
    expect(screen.getByText('Music')).toBeInTheDocument();
  });

  // The author line renders via the 'ListingCard.author' message. Under test the
  // messages are not translated, so the raw key is what appears in the DOM — assert
  // on that rather than on the interpolated display name, which never renders here.
  it('hides the author line for a teacher-profile listing, since the listing is the person', () => {
    render(<SearchResultsPanel listings={[teacherListing]} intl={fakeIntl} />, {
      config: getConfig(),
    });

    expect(screen.queryByText('ListingCard.author')).not.toBeInTheDocument();
  });

  it('leaves other listing types untouched — author shown, no overline', () => {
    render(<SearchResultsPanel listings={[eventListing]} intl={fakeIntl} />, {
      config: getConfig(),
    });

    expect(screen.getByText('Wheel Throwing')).toBeInTheDocument();
    expect(screen.getByText('ListingCard.author')).toBeInTheDocument();
    // 'Crafts' is the category of this listing but events cards get no overline.
    expect(screen.queryByText('Crafts')).not.toBeInTheDocument();
  });

  it('omits the overline when the listing has no category', () => {
    const noCategory = createListing(
      'teacher2',
      { title: 'No Category Teacher', publicData: { listingType: 'teacher-profile' } },
      { author: createUser('teacherUser2') }
    );

    render(<SearchResultsPanel listings={[noCategory]} intl={fakeIntl} />, {
      config: getConfig(),
    });

    expect(screen.getByText('No Category Teacher')).toBeInTheDocument();
    expect(screen.queryByText('Music')).not.toBeInTheDocument();
  });
});
