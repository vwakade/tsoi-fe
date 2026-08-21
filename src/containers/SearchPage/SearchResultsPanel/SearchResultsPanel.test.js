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
        {
          id: 'venue',
          transactionProcess: { name: 'default-inquiry', alias: 'default-inquiry/release-1' },
          unitType: 'inquiry',
          defaultListingFields: { price: false, images: true },
        },
        // A type outside the three catalogs, to pin that they get no special casing.
        {
          id: 'product-selling',
          transactionProcess: { name: 'default-purchase', alias: 'default-purchase/release-1' },
          unitType: 'item',
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

  // The design's EventCard shows the category as an overline and keeps the teacher
  // name, so unlike a teacher-profile card an events card gets both.
  it('shows the category overline and keeps the author line for an events listing', () => {
    render(<SearchResultsPanel listings={[eventListing]} intl={fakeIntl} />, {
      config: getConfig(),
    });

    expect(screen.getByText('Wheel Throwing')).toBeInTheDocument();
    expect(screen.getByText('ListingCard.author')).toBeInTheDocument();
    expect(screen.getByText('Crafts')).toBeInTheDocument();
  });

  it('shows spots left on an events listing, from currentStock', () => {
    const withStock = createListing(
      'event2',
      { title: 'Glazing Night', publicData: { listingType: 'events' } },
      { author: createUser('eventUser2'), currentStock: { attributes: { quantity: 3 } } }
    );

    render(<SearchResultsPanel listings={[withStock]} intl={fakeIntl} />, {
      config: getConfig(),
    });

    expect(screen.getByText('SearchResultsPanel.spotsLeft')).toBeInTheDocument();
  });

  // Absent stock means the listing does not track it, which is not the same as being
  // sold out — so the line is omitted rather than reading "0 spots left".
  it('omits spots left when the events listing has no currentStock', () => {
    render(<SearchResultsPanel listings={[eventListing]} intl={fakeIntl} />, {
      config: getConfig(),
    });

    expect(screen.queryByText('SearchResultsPanel.spotsLeft')).not.toBeInTheDocument();
  });

  it('shows capacity in the footer of a venue listing', () => {
    const venueListing = createListing(
      'venue1',
      { title: 'The Kiln Room', publicData: { listingType: 'venue', capacity: 12 } },
      { author: createUser('venueUser') }
    );

    render(<SearchResultsPanel listings={[venueListing]} intl={fakeIntl} />, {
      config: getConfig(),
    });

    expect(screen.getByText('The Kiln Room')).toBeInTheDocument();
    expect(screen.getByText('SearchResultsPanel.venueCapacity')).toBeInTheDocument();
  });

  it('leaves listing types outside the three catalogs untouched', () => {
    const otherListing = createListing(
      'other1',
      { title: 'Some Product', publicData: { listingType: 'product-selling' } },
      { author: createUser('otherUser') }
    );

    render(<SearchResultsPanel listings={[otherListing]} intl={fakeIntl} />, {
      config: getConfig(),
    });

    expect(screen.getByText('Some Product')).toBeInTheDocument();
    expect(screen.getByText('ListingCard.author')).toBeInTheDocument();
    expect(screen.queryByText('SearchResultsPanel.venueCapacity')).not.toBeInTheDocument();
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
