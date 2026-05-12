/**
 * Helper to format listing data from database to API response.
 * Parses stringified JSON fields (amenities, photos) back into arrays.
 */
export function formatListing(listing: any) {
  if (!listing) return null;
  return {
    ...listing,
    amenities: typeof listing.amenities === "string" ? JSON.parse(listing.amenities) : listing.amenities,
    photos: typeof listing.photos === "string" ? JSON.parse(listing.photos) : listing.photos,
  };
}
