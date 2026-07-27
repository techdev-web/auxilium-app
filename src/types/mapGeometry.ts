import type { LucideIcon } from 'lucide-react-native';
import {
  WavesHorizontal,
  MapPin,
  Waypoints,
  Square,
  WavesLadder,
  EvCharger,
} from 'lucide-react-native';

export type MapGeometryKind = 'Point' | 'LineString' | 'Polygon';

export type MapFeatureType =
  | 'substation'
  | 'river'
  | 'lake'
  | 'road'
  | 'land_parcel'
  | null;

/** GeoJSON-style coordinates: Point | LineString | Polygon ring(s). */
export type MapGeometryCoordinates =
  | number[]
  | number[][]
  | number[][][];

export type MapGeometry = {
  id: string;
  kind: MapGeometryKind;
  featureType: MapFeatureType;
  coordinates: MapGeometryCoordinates;
  color: string;
  /** Fill/stroke opacity in 0–1. */
  opacity: number;
  zIndex: number;
  label?: string;
  /** When false, feature is hidden on the map. Defaults to true. */
  visible?: boolean;
};

/** Geographic bounding box for image overlays. */
export type ImageOverlayBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapImageOverlay = {
  id: string;
  kind: 'ImageOverlay';
  imageUri: string;
  bounds: ImageOverlayBounds;
  /** Rotation in degrees, clockwise. */
  rotation: number;
  opacity: number;
  zIndex: number;
  label?: string;
  /** When false, overlay is hidden on the map. Defaults to true. */
  visible?: boolean;
};

/** Any item that can appear on the map. */
export type MapFeature = MapGeometry | MapImageOverlay;

export function isImageOverlay(feature: MapFeature): feature is MapImageOverlay {
  return feature.kind === 'ImageOverlay';
}

export function isGeometry(feature: MapFeature): feature is MapGeometry {
  return feature.kind !== 'ImageOverlay';
}

export const DEFAULT_IMAGE_OVERLAY_OPACITY = 0.8;

/** Ensure north > south and east > west, swapping if needed. */
export function clampBounds(bounds: ImageOverlayBounds): ImageOverlayBounds {
  return {
    north: Math.max(bounds.north, bounds.south),
    south: Math.min(bounds.north, bounds.south),
    east: Math.max(bounds.east, bounds.west),
    west: Math.min(bounds.east, bounds.west),
  };
}

function rotatePoint(
  cx: number,
  cy: number,
  x: number,
  y: number,
  angleDeg: number,
): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

/**
 * Convert ImageOverlayBounds + rotation to the [topLeft, topRight, bottomRight, bottomLeft]
 * coordinates format that MapLibre ImageSource expects.
 */
export function boundsToCoordinates(
  bounds: ImageOverlayBounds,
  rotation: number = 0,
): [[number, number], [number, number], [number, number], [number, number]] {
  const b = clampBounds(bounds);
  const corners: [number, number][] = [
    [b.west, b.north],
    [b.east, b.north],
    [b.east, b.south],
    [b.west, b.south],
  ];
  if (rotation === 0) {
    return corners as [[number, number], [number, number], [number, number], [number, number]];
  }
  const cx = (b.west + b.east) / 2;
  const cy = (b.north + b.south) / 2;
  return corners.map(([x, y]) => rotatePoint(cx, cy, x, y, rotation)) as [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ];
}

/** Create default bounds around a center point, roughly 500m on each side at the equator. */
export function defaultOverlayBounds(
  centerLng: number,
  centerLat: number,
  zoom: number,
): ImageOverlayBounds {
  const spanDeg = 180 / Math.pow(2, zoom);
  const halfSpan = spanDeg * 0.15;
  return {
    north: centerLat + halfSpan,
    south: centerLat - halfSpan,
    east: centerLng + halfSpan,
    west: centerLng - halfSpan,
  };
}

/** Default fill opacity for polygons (partial so underlying map stays visible). */
export const DEFAULT_POLYGON_OPACITY = 0.4;
/** Default opacity for points and lines (fully opaque). */
export const DEFAULT_OPAQUE_OPACITY = 1;

export function getDefaultOpacity(kind: MapGeometryKind | 'ImageOverlay'): number {
  if (kind === 'Polygon') {
    return DEFAULT_POLYGON_OPACITY;
  }
  if (kind === 'ImageOverlay') {
    return DEFAULT_IMAGE_OVERLAY_OPACITY;
  }
  return DEFAULT_OPAQUE_OPACITY;
}

export function clampOpacity(value: number): number {
  if (Number.isNaN(value)) {
    return DEFAULT_OPAQUE_OPACITY;
  }
  return Math.min(1, Math.max(0, value));
}

/** Resolve opacity for legacy geometries that predate the field. */
export function resolveOpacity(geometry: {
  kind: MapGeometryKind | 'ImageOverlay';
  opacity?: number;
}): number {
  if (typeof geometry.opacity === 'number' && !Number.isNaN(geometry.opacity)) {
    return clampOpacity(geometry.opacity);
  }
  return getDefaultOpacity(geometry.kind);
}

export function isFeatureVisible(feature: {
  visible?: boolean;
}): boolean {
  return feature.visible !== false;
}

export function normalizeMapGeometry(
  geometry: Omit<MapGeometry, 'opacity'> & {
    opacity?: number;
    visible?: boolean;
  },
): MapGeometry {
  return {
    ...geometry,
    opacity: resolveOpacity(geometry),
    visible: geometry.visible !== false,
  };
}

export function normalizeMapGeometries(
  geometries: Array<
    Omit<MapGeometry, 'opacity'> & { opacity?: number; visible?: boolean }
  >,
): MapGeometry[] {
  return geometries.map(normalizeMapGeometry);
}

export function normalizeMapImageOverlay(
  overlay: Omit<MapImageOverlay, 'opacity' | 'rotation'> & {
    opacity?: number;
    rotation?: number;
    visible?: boolean;
  },
): MapImageOverlay {
  return {
    ...overlay,
    opacity: resolveOpacity({
      kind: 'ImageOverlay',
      opacity: overlay.opacity,
    }),
    rotation:
      typeof overlay.rotation === 'number' && !Number.isNaN(overlay.rotation)
        ? overlay.rotation
        : 0,
    visible: overlay.visible !== false,
  };
}

export function normalizeMapImageOverlays(
  overlays: Array<
    Omit<MapImageOverlay, 'opacity' | 'rotation'> & {
      opacity?: number;
      rotation?: number;
      visible?: boolean;
    }
  >,
): MapImageOverlay[] {
  return overlays.map(normalizeMapImageOverlay);
}

export type MapFeatureTypeOption = {
  value: Exclude<MapFeatureType, null>;
  label: string;
  icon: LucideIcon;
  defaultColor: string;
};

export const MAP_FEATURE_TYPE_OPTIONS: MapFeatureTypeOption[] = [
  {
    value: 'substation',
    label: 'Substation',
    icon: EvCharger,
    defaultColor: '#E67E22',
  },
  {
    value: 'river',
    label: 'River',
    icon: WavesLadder,
    defaultColor: '#3498DB',
  },
  {
    value: 'lake',
    label: 'Lake',
    icon: WavesHorizontal,
    defaultColor: '#2980B9',
  },
  {
    value: 'road',
    label: 'Road',
    icon: Waypoints,
    defaultColor: '#7F8C8D',
  },
  {
    value: 'land_parcel',
    label: 'Land parcel',
    icon: Square,
    defaultColor: '#27AE60',
  },
];

export const DEFAULT_MAP_FEATURE_ICON: LucideIcon = MapPin;
export const DEFAULT_GEOMETRY_COLOR = '#0074D9';

export const GEOMETRY_COLOR_PALETTE = [
  '#0074D9',
  '#3D9970',
  '#E67E22',
  '#E74C3C',
  '#9B59B6',
  '#3498DB',
  '#1ABC9C',
  '#F1C40F',
  '#7F8C8D',
  '#2C3E50',
] as const;

export function getFeatureTypeMeta(
  featureType: MapFeatureType,
): { label: string; icon: LucideIcon; defaultColor: string } {
  if (featureType == null) {
    return {
      label: 'Unspecified',
      icon: DEFAULT_MAP_FEATURE_ICON,
      defaultColor: DEFAULT_GEOMETRY_COLOR,
    };
  }
  const match = MAP_FEATURE_TYPE_OPTIONS.find(o => o.value === featureType);
  if (!match) {
    return {
      label: 'Unspecified',
      icon: DEFAULT_MAP_FEATURE_ICON,
      defaultColor: DEFAULT_GEOMETRY_COLOR,
    };
  }
  return {
    label: match.label,
    icon: match.icon,
    defaultColor: match.defaultColor,
  };
}

export function createMapGeometryId(): string {
  return `geom_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
