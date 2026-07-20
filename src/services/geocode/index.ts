import { BigDataCloudGeocoder } from './BigDataCloudGeocoder';
import type { Geocoder } from './Geocoder';
// import { GoogleMapsGeocoder } from './GoogleMapsGeocoder';

/**
 * Active geocoder provider.
 * To switch to Google later: `new GoogleMapsGeocoder()` (and uncomment the import).
 */
export const geocoder: Geocoder = new BigDataCloudGeocoder();

export async function reverseGeocodeAdminNames(
  latitude: number,
  longitude: number,
) {
  return geocoder.reverseGeocodeAdminNames(latitude, longitude);
}

export async function forwardGeocodeCoordinates(query: string) {
  return geocoder.forwardGeocodeCoordinates(query);
}

export type { GeocodeCoordinates } from './Geocoder';
export { Geocoder } from './Geocoder';
export { BigDataCloudGeocoder } from './BigDataCloudGeocoder';
export { GoogleMapsGeocoder } from './GoogleMapsGeocoder';
