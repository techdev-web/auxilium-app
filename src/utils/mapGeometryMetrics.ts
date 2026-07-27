import type { Position } from 'geojson';
import type { MapGeometry } from '../types/mapGeometry';

const EARTH_RADIUS_M = 6_378_137;
const SQ_METERS_PER_ACRE = 4046.8564224;

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function asPosition(coords: number[]): Position | null {
  if (coords.length < 2) {
    return null;
  }
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (Number.isNaN(lng) || Number.isNaN(lat)) {
    return null;
  }
  return [lng, lat];
}

/** Great-circle distance between two WGS84 positions, in meters. */
export function haversineMeters(a: Position, b: Position): number {
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

function linePositions(geometry: MapGeometry): Position[] {
  if (geometry.kind !== 'LineString') {
    return [];
  }
  return (geometry.coordinates as number[][])
    .map(asPosition)
    .filter((p): p is Position => p != null);
}

function polygonOuterRing(geometry: MapGeometry): Position[] {
  if (geometry.kind !== 'Polygon') {
    return [];
  }
  const rings = geometry.coordinates as number[][][];
  let ringCoords: number[][];
  if (Array.isArray(rings?.[0]?.[0]) && typeof rings[0][0][0] === 'number') {
    ringCoords = rings[0];
  } else {
    ringCoords = geometry.coordinates as number[][];
  }
  const ring = ringCoords
    .map(asPosition)
    .filter((p): p is Position => p != null);
  if (ring.length < 2) {
    return ring;
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) {
    return ring;
  }
  return [...ring, first];
}

/**
 * LineString length in meters (sum of segment great-circle distances).
 * Returns null when the geometry is not a measurable line.
 */
export function getLineDistanceMeters(geometry: MapGeometry): number | null {
  const positions = linePositions(geometry);
  if (positions.length < 2) {
    return null;
  }
  let total = 0;
  for (let i = 1; i < positions.length; i += 1) {
    total += haversineMeters(positions[i - 1], positions[i]);
  }
  return total;
}

/**
 * Polygon area in square meters using the spherical excess method
 * (@mapbox/geojson-area ringArea). Absolute value; holes ignored (outer ring only).
 */
export function getPolygonAreaSquareMeters(
  geometry: MapGeometry,
): number | null {
  const coords = polygonOuterRing(geometry);
  const coordsLength = coords.length;
  if (coordsLength < 4) {
    return null;
  }

  let area = 0;
  for (let i = 0; i < coordsLength; i += 1) {
    let lowerIndex: number;
    let middleIndex: number;
    let upperIndex: number;
    if (i === coordsLength - 2) {
      lowerIndex = coordsLength - 2;
      middleIndex = coordsLength - 1;
      upperIndex = 0;
    } else if (i === coordsLength - 1) {
      lowerIndex = coordsLength - 1;
      middleIndex = 0;
      upperIndex = 1;
    } else {
      lowerIndex = i;
      middleIndex = i + 1;
      upperIndex = i + 2;
    }
    const p1 = coords[lowerIndex];
    const p2 = coords[middleIndex];
    const p3 = coords[upperIndex];
    area += (toRad(p3[0]) - toRad(p1[0])) * Math.sin(toRad(p2[1]));
  }
  area = (area * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2;
  return Math.abs(area);
}

export function formatDistanceKm(meters: number): string {
  const km = meters / 1000;
  if (km < 0.01) {
    return `${Math.max(1, Math.round(meters))} m`;
  }
  if (km < 10) {
    return `${km.toFixed(2)} km`;
  }
  if (km < 100) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

export function formatAreaAcres(squareMeters: number): string {
  const acres = squareMeters / SQ_METERS_PER_ACRE;
  if (acres < 0.01) {
    return `${acres.toFixed(3)} ac`;
  }
  if (acres < 10) {
    return `${acres.toFixed(2)} ac`;
  }
  if (acres < 100) {
    return `${acres.toFixed(1)} ac`;
  }
  return `${Math.round(acres)} ac`;
}

/** Measurement text for map labels (km for lines, acres for polygons). */
export function getGeometryMeasurementLabel(
  geometry: MapGeometry,
): string | null {
  if (geometry.kind === 'LineString') {
    const meters = getLineDistanceMeters(geometry);
    return meters == null ? null : formatDistanceKm(meters);
  }
  if (geometry.kind === 'Polygon') {
    const area = getPolygonAreaSquareMeters(geometry);
    return area == null ? null : formatAreaAcres(area);
  }
  return null;
}

/** Combined display label: optional name + measurement for lines/polygons. */
export function getMapDisplayLabel(geometry: MapGeometry): string | null {
  const name = geometry.label?.trim() ?? '';
  const measurement = getGeometryMeasurementLabel(geometry);
  if (name && measurement) {
    return `${name}\n${measurement}`;
  }
  if (measurement) {
    return measurement;
  }
  if (name) {
    return name;
  }
  return null;
}
