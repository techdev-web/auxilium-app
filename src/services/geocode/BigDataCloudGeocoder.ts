import type { AdminPlaceNames } from '../../types/location';
import { Geocoder, type GeocodeCoordinates } from './Geocoder';

type BigDataCloudAdmin = {
  adminLevel?: number;
  name?: string;
  description?: string;
};

type BigDataCloudResponse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  localityInfo?: {
    administrative?: BigDataCloudAdmin[];
  };
};

const NOMINATIM_UA = 'AuxiliumGIS/1.0 (land-gis; contact@auxilium.app)';

export class BigDataCloudGeocoder extends Geocoder {
  async reverseGeocodeAdminNames(
    latitude: number,
    longitude: number,
  ): Promise<AdminPlaceNames> {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${encodeURIComponent(String(latitude))}` +
      `&longitude=${encodeURIComponent(String(longitude))}` +
      `&localityLanguage=en`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Unable to reverse-geocode coordinates');
    }

    const data = (await response.json()) as BigDataCloudResponse;
    const admins = data.localityInfo?.administrative ?? [];
    const byLevel = new Map<number, BigDataCloudAdmin[]>();

    for (const admin of admins) {
      const level = admin.adminLevel;
      if (level == null) {
        continue;
      }
      const list = byLevel.get(level) ?? [];
      list.push(admin);
      byLevel.set(level, list);
    }

    const state =
      byLevel.get(4)?.[0]?.name ?? data.principalSubdivision ?? undefined;
    const districtRaw = byLevel.get(5)?.[0]?.name;
    const district = districtRaw
      ? this.stripAdminSuffix(districtRaw, /\s*district$/i)
      : undefined;

    const level6 = byLevel.get(6) ?? [];
    const subDistrictAdmin = level6.find(a =>
      /taluka|tehsil|sub[-\s]?district|subdivision/i.test(
        `${a.description ?? ''} ${a.name ?? ''}`,
      ),
    );
    const settlementAdmin = level6.find(
      a =>
        a !== subDistrictAdmin &&
        /settlement|village|town|city|locality|human/i.test(
          a.description ?? '',
        ),
    );

    const subDistrict = subDistrictAdmin?.name
      ? this.stripAdminSuffix(subDistrictAdmin.name, /\s*(taluka|tehsil)$/i)
      : undefined;

    const village =
      settlementAdmin?.name ?? data.locality ?? data.city ?? undefined;

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
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=json&limit=1&countrycodes=in`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': NOMINATIM_UA,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
    }>;
    const first = results[0];
    if (!first?.lat || !first?.lon) {
      return null;
    }

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }
}
