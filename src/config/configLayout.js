///////////////////////////////////////////////////////
// This file contains configs that affect layout     //
// NOTE: these are just some of the relevant configs //
// Most of the work happens in components.           //
///////////////////////////////////////////////////////

// Note: These come from the layout asset nowadays by default.
//       To use this built-in configuration, you need to remove the overwrite from configHelper.js (mergeLayouts func)

// There are 2 SearchPage variants that can be used:
// 'map' & 'grid'
//
// 'grid' matches the School of Imperfection design (all three browse pages are grids),
// and the map variant needs REACT_APP_MAPBOX_ACCESS_TOKEN, which is not set.
//
// NOTE: this is only the fallback. `mergeLayouts` in util/configHelpers.js prefers the
// hosted layout asset whenever it specifies a variantType, so the live value has to be
// set in Console as well — changing it here alone will not switch the deployed app.
export const searchPage = {
  variantType: 'grid',
};

// ListingPage has 2 layout options: 'coverPhoto' and 'carousel'.
// - 'coverPhoto' means a layout where there's a hero section with cropped image in the beginning of the page
// - 'carousel' shows image carousel, where listing images are shown with the original aspect ratio
export const listingPage = {
  variantType: 'carousel',
};

// ListingImage currently supports only one variant type, but it has aspectRatio as an extra configuration.
export const listingImage = {
  variantType: 'cropImage',
  // Aspect ratio for listing image variants (width/height)
  // Note: This will be converted to separate aspectWidth and aspectHeight values
  // to make calculations easier.
  aspectRatio: '4/3',
  // Listings have custom image variants, which are named here.
  variantPrefix: 'listing-card',
};
