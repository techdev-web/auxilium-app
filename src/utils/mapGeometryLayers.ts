import type {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Polygon,
  Position,
} from 'geojson';
import {
  resolveOpacity,
  type MapGeometry,
  type MapGeometryCoordinates,
  type MapGeometryKind,
} from '../types/mapGeometry';

export type MapGeometryProperties = {
  id: string;
  color: string;
  opacity: number;
  zIndex: number;
  label: string;
  kind: MapGeometryKind;
  featureType: string;
};

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

export function sortGeometriesByZIndex(
  geometries: MapGeometry[],
): MapGeometry[] {
  return [...geometries].sort((a, b) => a.zIndex - b.zIndex);
}

export function closePolygonRing(ring: Position[]): Position[] {
  if (ring.length === 0) {
    return ring;
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) {
    return ring;
  }
  return [...ring, first];
}

export function geometryToFeature(
  geometry: MapGeometry,
): Feature<Point | LineString | Polygon, MapGeometryProperties> | null {
  const properties: MapGeometryProperties = {
    id: geometry.id,
    color: geometry.color,
    opacity: resolveOpacity(geometry),
    zIndex: geometry.zIndex,
    label: geometry.label?.trim() || '',
    kind: geometry.kind,
    featureType: geometry.featureType ?? '',
  };

  if (geometry.kind === 'Point') {
    const position = asPosition(geometry.coordinates as number[]);
    if (!position) {
      return null;
    }
    return {
      type: 'Feature',
      id: geometry.id,
      properties,
      geometry: { type: 'Point', coordinates: position },
    };
  }

  if (geometry.kind === 'LineString') {
    const line = (geometry.coordinates as number[][])
      .map(asPosition)
      .filter((p): p is Position => p != null);
    if (line.length < 2) {
      return null;
    }
    return {
      type: 'Feature',
      id: geometry.id,
      properties,
      geometry: { type: 'LineString', coordinates: line },
    };
  }

  const rings = geometry.coordinates as number[][][];
  if (!Array.isArray(rings) || rings.length === 0) {
    // Also accept a single ring as number[][]
    const flatRing = geometry.coordinates as number[][];
    if (
      Array.isArray(flatRing) &&
      flatRing.length > 0 &&
      typeof flatRing[0]?.[0] === 'number'
    ) {
      const ring = flatRing
        .map(asPosition)
        .filter((p): p is Position => p != null);
      if (ring.length < 3) {
        return null;
      }
      return {
        type: 'Feature',
        id: geometry.id,
        properties,
        geometry: {
          type: 'Polygon',
          coordinates: [closePolygonRing(ring)],
        },
      };
    }
    return null;
  }

  const polygonRings = rings.map(ring =>
    ring.map(asPosition).filter((p): p is Position => p != null),
  );
  if (polygonRings[0]?.length < 3) {
    return null;
  }
  return {
    type: 'Feature',
    id: geometry.id,
    properties,
    geometry: {
      type: 'Polygon',
      coordinates: polygonRings.map(closePolygonRing),
    },
  };
}

export function geometriesToFeatureCollection(
  geometries: MapGeometry[],
): FeatureCollection<Point | LineString | Polygon, MapGeometryProperties> {
  const features = sortGeometriesByZIndex(geometries)
    .map(geometryToFeature)
    .filter(
      (
        f,
      ): f is Feature<Point | LineString | Polygon, MapGeometryProperties> =>
        f != null,
    );

  return { type: 'FeatureCollection', features };
}

export function draftLineCollection(
  vertices: Position[],
): FeatureCollection<LineString | Point> {
  const features: Feature<LineString | Point>[] = [];
  if (vertices.length >= 2) {
    features.push({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: vertices },
    });
  }
  for (let i = 0; i < vertices.length; i += 1) {
    features.push({
      type: 'Feature',
      properties: { index: i },
      geometry: { type: 'Point', coordinates: vertices[i] },
    });
  }
  return { type: 'FeatureCollection', features };
}

export function draftPolygonCollection(
  vertices: Position[],
): FeatureCollection<Polygon | LineString | Point> {
  const features: Feature<Polygon | LineString | Point>[] = [];
  if (vertices.length >= 3) {
    features.push({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [closePolygonRing(vertices)],
      },
    });
  } else if (vertices.length === 2) {
    features.push({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: vertices },
    });
  }
  for (let i = 0; i < vertices.length; i += 1) {
    features.push({
      type: 'Feature',
      properties: { index: i },
      geometry: { type: 'Point', coordinates: vertices[i] },
    });
  }
  return { type: 'FeatureCollection', features };
}

export function pointCoordinatesFromLngLat(
  longitude: number,
  latitude: number,
): MapGeometryCoordinates {
  return [longitude, latitude];
}

export function lineCoordinatesFromVertices(
  vertices: Position[],
): MapGeometryCoordinates {
  return vertices.map(v => [v[0], v[1]]);
}

export function polygonCoordinatesFromVertices(
  vertices: Position[],
): MapGeometryCoordinates {
  return [closePolygonRing(vertices.map(v => [v[0], v[1]]))];
}

export function getGeometryCentroid(
  geometry: MapGeometry,
): { longitude: number; latitude: number } | null {
  if (geometry.kind === 'Point') {
    const [lng, lat] = geometry.coordinates as number[];
    if (lng == null || lat == null) {
      return null;
    }
    return { longitude: lng, latitude: lat };
  }

  const positions: Position[] =
    geometry.kind === 'LineString'
      ? ((geometry.coordinates as number[][])
          .map(asPosition)
          .filter((p): p is Position => p != null) as Position[])
      : ((
          Array.isArray((geometry.coordinates as number[][][])[0]?.[0])
            ? (geometry.coordinates as number[][][])[0]
            : (geometry.coordinates as number[][])
        )
          ?.map(asPosition)
          .filter((p): p is Position => p != null) as Position[]) ?? [];

  if (positions.length === 0) {
    return null;
  }

  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of positions) {
    sumLng += lng;
    sumLat += lat;
  }
  return {
    longitude: sumLng / positions.length,
    latitude: sumLat / positions.length,
  };
}

function positionsEqual(a: Position, b: Position): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Open ring / line vertices suitable for editing (no duplicate closing point). */
export function getEditableVertices(geometry: MapGeometry): Position[] {
  if (geometry.kind === 'Point') {
    const position = asPosition(geometry.coordinates as number[]);
    return position ? [position] : [];
  }

  if (geometry.kind === 'LineString') {
    return (geometry.coordinates as number[][])
      .map(asPosition)
      .filter((p): p is Position => p != null);
  }

  const rings = geometry.coordinates as number[][][];
  let ring: Position[] = [];
  if (Array.isArray(rings?.[0]?.[0]) && typeof rings[0][0][0] === 'number') {
    ring = rings[0]
      .map(asPosition)
      .filter((p): p is Position => p != null);
  } else {
    ring = (geometry.coordinates as number[][])
      .map(asPosition)
      .filter((p): p is Position => p != null);
  }

  if (
    ring.length >= 2 &&
    positionsEqual(ring[0], ring[ring.length - 1])
  ) {
    return ring.slice(0, -1);
  }
  return ring;
}

export type MidpointHandle = {
  /** Insert new vertex at this index (between previous and next). */
  insertAtIndex: number;
  longitude: number;
  latitude: number;
};

export function getMidpointHandles(geometry: MapGeometry): MidpointHandle[] {
  if (geometry.kind === 'Point') {
    return [];
  }

  const vertices = getEditableVertices(geometry);
  if (vertices.length < 2) {
    return [];
  }

  const handles: MidpointHandle[] = [];
  const segmentCount =
    geometry.kind === 'Polygon' ? vertices.length : vertices.length - 1;

  for (let i = 0; i < segmentCount; i += 1) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    handles.push({
      insertAtIndex: i + 1,
      longitude: (a[0] + b[0]) / 2,
      latitude: (a[1] + b[1]) / 2,
    });
  }

  return handles;
}

export function updateGeometryVertex(
  geometry: MapGeometry,
  vertexIndex: number,
  longitude: number,
  latitude: number,
): MapGeometry {
  if (geometry.kind === 'Point') {
    return {
      ...geometry,
      coordinates: pointCoordinatesFromLngLat(longitude, latitude),
    };
  }

  const vertices = getEditableVertices(geometry);
  if (vertexIndex < 0 || vertexIndex >= vertices.length) {
    return geometry;
  }

  const next = vertices.map((v, i) =>
    i === vertexIndex ? ([longitude, latitude] as Position) : v,
  );

  if (geometry.kind === 'LineString') {
    return {
      ...geometry,
      coordinates: lineCoordinatesFromVertices(next),
    };
  }

  return {
    ...geometry,
    coordinates: polygonCoordinatesFromVertices(next),
  };
}

export function insertGeometryVertex(
  geometry: MapGeometry,
  insertAtIndex: number,
  longitude: number,
  latitude: number,
): MapGeometry {
  if (geometry.kind === 'Point') {
    return geometry;
  }

  const vertices = getEditableVertices(geometry);
  const clamped = Math.max(0, Math.min(insertAtIndex, vertices.length));
  const next = [
    ...vertices.slice(0, clamped),
    [longitude, latitude] as Position,
    ...vertices.slice(clamped),
  ];

  if (geometry.kind === 'LineString') {
    return {
      ...geometry,
      coordinates: lineCoordinatesFromVertices(next),
    };
  }

  return {
    ...geometry,
    coordinates: polygonCoordinatesFromVertices(next),
  };
}
