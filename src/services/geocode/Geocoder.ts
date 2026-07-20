import type { AdminPlaceNames } from '../../types/location';

export type GeocodeCoordinates = {
  latitude: number;
  longitude: number;
};

/** Swap concrete providers (BigDataCloud ↔ Google) without changing call sites. */
export abstract class Geocoder {
  abstract reverseGeocodeAdminNames(
    latitude: number,
    longitude: number,
  ): Promise<AdminPlaceNames>;

  abstract forwardGeocodeCoordinates(
    query: string,
  ): Promise<GeocodeCoordinates | null>;

  protected stripAdminSuffix(name: string, suffixes: RegExp): string {
    return name.replace(suffixes, '').trim();
  }
}
