import { GOOGLE_MAPS_API_KEY } from '../../constants/googleMaps';
import type { AdminPlaceNames } from '../../types/location';
import { Geocoder, type GeocodeCoordinates } from './Geocoder';

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleGeocodeResult = {
  address_components: GoogleAddressComponent[];
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
};

type GoogleGeocodeResponse = {
  status: string;
  error_message?: string;
  results?: GoogleGeocodeResult[];
};

/** Ready to swap in once the Maps key allows Geocoding API from this app. */
export class GoogleMapsGeocoder extends Geocoder {
  private assertApiKey(): void {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error(
        'GOOGLE_MAPS_API_KEY is missing. Set it in src/constants/googleMaps.ts',
      );
    }
  }

  private async geocode(
    params: Record<string, string>,
  ): Promise<GoogleGeocodeResult[]> {
    this.assertApiKey();

    const query = new URLSearchParams({
      ...params,
      key: GOOGLE_MAPS_API_KEY,
      language: 'en',
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${query.toString()}`,
    );
    if (!response.ok) {
      throw new Error(`Google Geocoding request failed (${response.status})`);
    }

    const data = (await response.json()) as GoogleGeocodeResponse;
    if (data.status === 'ZERO_RESULTS') {
      return [];
    }
    if (data.status !== 'OK') {
      throw new Error(
        data.error_message ?? `Google Geocoding failed (${data.status})`,
      );
    }

    return data.results ?? [];
  }

  private componentByType(
    components: GoogleAddressComponent[],
    type: string,
  ): string | undefined {
    return components.find(c => c.types.includes(type))?.long_name;
  }

  private collectComponents(
    results: GoogleGeocodeResult[],
  ): GoogleAddressComponent[] {
    const seen = new Set<string>();
    const merged: GoogleAddressComponent[] = [];

    for (const result of results) {
      for (const component of result.address_components ?? []) {
        const key = `${component.long_name}|${component.types.join(',')}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        merged.push(component);
      }
    }

    return merged;
  }

  async reverseGeocodeAdminNames(
    latitude: number,
    longitude: number,
  ): Promise<AdminPlaceNames> {
    const results = await this.geocode({
      latlng: `${latitude},${longitude}`,
    });

    if (!results.length) {
      return {};
    }

    const components = this.collectComponents(results);

    const state = this.componentByType(
      components,
      'administrative_area_level_1',
    );

    const districtRaw = this.componentByType(
      components,
      'administrative_area_level_2',
    );
    const district = districtRaw
      ? this.stripAdminSuffix(districtRaw, /\s*district$/i)
      : undefined;

    const subDistrictRaw =
      this.componentByType(components, 'administrative_area_level_3') ??
      this.componentByType(components, 'administrative_area_level_4');
    const subDistrict = subDistrictRaw
      ? this.stripAdminSuffix(
          subDistrictRaw,
          /\s*(taluka|tehsil|sub[-\s]?district)$/i,
        )
      : undefined;

    const village =
      this.componentByType(components, 'sublocality_level_1') ??
      this.componentByType(components, 'sublocality') ??
      this.componentByType(components, 'neighborhood') ??
      this.componentByType(components, 'locality') ??
      undefined;

    return {
      state,
      district,
      subDistrict,
      village,
    };
  }

  async forwardGeocodeCoordinates(
    query: string,
  ): Promise<GeocodeCoordinates | null> {
    const results = await this.geocode({
      address: query,
      components: 'country:IN',
    });

    const location = results[0]?.geometry?.location;
    if (location?.lat == null || location?.lng == null) {
      return null;
    }

    const latitude = Number(location.lat);
    const longitude = Number(location.lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }
}
