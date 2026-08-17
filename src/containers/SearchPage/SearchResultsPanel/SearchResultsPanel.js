import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { propTypes } from '../../../util/types';
import { ListingCard, PaginationLinks } from '../../../components';

import css from './SearchResultsPanel.module.css';

// Listing types that represent a person rather than a bookable thing, so the
// author line is redundant — a teacher-profile listing *is* the teacher.
const PROFILE_LIKE_LISTING_TYPES = ['teacher-profile'];

/**
 * Presentation tweaks for a card, derived from the listing's type.
 *
 * Kept here rather than inside ListingCard so the shared component stays generic
 * and upgradeable — see the `overline` prop note in ListingCard.js.
 *
 * NOTE: the card image aspect ratio is deliberately NOT overridden per type. Image
 * variants are generated at the marketplace-wide `layout.listingImage.aspectRatio`,
 * and nothing sets `object-fit` on the img, so forcing a different box ratio here
 * would stretch the photo. Changing the ratio is a Console-level decision.
 *
 * @param {Object} listing API entity
 * @param {Array} categories config.categoryConfiguration.categories
 * @returns {Object} extra props for ListingCard
 */
const cardPropsForListing = (listing, categories = []) => {
  const publicData = listing?.attributes?.publicData || {};
  const { listingType, categoryLevel1 } = publicData;

  if (!PROFILE_LIKE_LISTING_TYPES.includes(listingType)) {
    return {};
  }

  const category = categories.find(c => c.id === categoryLevel1);

  return {
    showAuthorInfo: false,
    // `name` is the label authored in Console; fall back to nothing rather than
    // showing a raw id.
    overline: category?.name || null,
  };
};

/**
 * SearchResultsPanel component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {Array<propTypes.listing>} props.listings - The listings
 * @param {propTypes.pagination} props.pagination - The pagination
 * @param {Object} props.search - The search
 * @param {Function} props.setActiveListing - The function to handle the active listing
 * @param {boolean} [props.isMapVariant] - Whether the map variant is enabled
 * @returns {JSX.Element}
 */
const SearchResultsPanel = props => {
  const {
    className,
    rootClassName,
    listings = [],
    pagination,
    search,
    setActiveListing,
    isMapVariant = true,
    listingTypeParam,
    intl,
  } = props;
  const config = useConfiguration();
  const categories = config.categoryConfiguration?.categories || [];
  const classes = classNames(rootClassName || css.root, className);
  const pageName = listingTypeParam ? 'SearchPageWithListingType' : 'SearchPage';

  const paginationLinks =
    pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName={pageName}
        pagePathParams={{ listingType: listingTypeParam }}
        pageSearchParams={search}
        pagination={pagination}
        aria-label={intl.formatMessage({ id: 'SearchResultsPanel.screenreader.pagination' })}
      />
    ) : null;

  const cardRenderSizes = isMapVariant => {
    if (isMapVariant) {
      // Panel width relative to the viewport
      const panelMediumWidth = 50;
      const panelLargeWidth = 62.5;
      return [
        '(max-width: 767px) 100vw',
        `(max-width: 1023px) ${panelMediumWidth}vw`,
        `(max-width: 1920px) ${panelLargeWidth / 2}vw`,
        `${panelLargeWidth / 3}vw`,
      ].join(', ');
    } else {
      // Panel width relative to the viewport
      const panelMediumWidth = 50;
      const panelLargeWidth = 62.5;
      return [
        '(max-width: 549px) 100vw',
        '(max-width: 767px) 50vw',
        `(max-width: 1439px) 26vw`,
        `(max-width: 1920px) 18vw`,
        `14vw`,
      ].join(', ');
    }
  };

  return (
    <div className={classes}>
      <ul className={isMapVariant ? css.listingCardsMapVariant : css.listingCards}>
        {listings.map(l => (
          <li key={l.id.uuid} className={css.resultItem}>
            <ListingCard
              className={css.listingCard}
              listing={l}
              renderSizes={cardRenderSizes(isMapVariant)}
              setActiveListing={setActiveListing}
              {...cardPropsForListing(l, categories)}
            />
          </li>
        ))}
        {props.children}
      </ul>
      {paginationLinks}
    </div>
  );
};

export default SearchResultsPanel;
