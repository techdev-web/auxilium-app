import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  Text,
  View,
  type NativeSyntheticEvent,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  Camera,
  GeoJSONSource,
  ImageSource,
  Layer,
  Map,
  ViewAnnotation,
  type CameraRef,
  type PressEvent,
  type PressEventWithFeatures,
  type ViewAnnotationEvent,
  type ViewAnnotationRef,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import type { Position } from 'geojson';
import { Minus, Plus, LocateFixed } from 'lucide-react-native';
import { OSM_RASTER_STYLE } from '../../constants/mapStyle';
import {
  boundsToCoordinates,
  getFeatureTypeMeta,
  isFeatureVisible,
  resolveOpacity,
  type MapGeometry,
  type MapImageOverlay,
} from '../../types/mapGeometry';
import {
  draftLineCollection,
  draftPolygonCollection,
  geometryToFeature,
  getGeometryCentroid,
  lineCoordinatesFromVertices,
  polygonCoordinatesFromVertices,
  sortGeometriesByZIndex,
} from '../../utils/mapGeometryLayers';
import { getMapDisplayLabel } from '../../utils/mapGeometryMetrics';
import AnnotationContent from './AnnotationContent';
import type { DrawMode } from './DrawToolbar';
import OverlayEditHandles from './OverlayEditHandles';
import VertexEditHandles from './VertexEditHandles';

const DEFAULT_CENTER = { latitude: 22.9734, longitude: 78.6569 };
const DEFAULT_ZOOM = 4.5;
const MIN_ZOOM = 2;
const MAX_ZOOM = 18;
const ZOOM_STEP = 1;
/** Fixed annotation box — badge + optional label above. */
const POINT_BADGE_SIZE = 28;
const POINT_BADGE_SELECTED = 32;
const POINT_MARKER_WIDTH = 44;
const POINT_LABEL_HEIGHT = 22;
const POINT_ICON_SIZE = 14;
const POINT_ICON_SELECTED = 16;

type LayerStackItem =
  | {
      type: 'geometry';
      id: string;
      zIndex: number;
      geometry: MapGeometry;
    }
  | {
      type: 'overlay';
      id: string;
      zIndex: number;
      overlay: MapImageOverlay;
    };

type Props = {
  geometries: MapGeometry[];
  imageOverlays: MapImageOverlay[];
  selectedId: string | null;
  mode: DrawMode;
  draftVertices: Position[];
  initialLatitude?: number;
  initialLongitude?: number;
  initialZoom?: number;
  editable?: boolean;
  selectedVertexIndex?: number | null;
  onMapPress: (longitude: number, latitude: number) => void;
  onSelectFeature: (id: string | null) => void;
  onSelectVertex?: (vertexIndex: number | null) => void;
  onMoveVertex: (
    geometryId: string,
    vertexIndex: number,
    longitude: number,
    latitude: number,
  ) => void;
  onInsertVertex: (
    geometryId: string,
    insertAtIndex: number,
    longitude: number,
    latitude: number,
  ) => void;
  onMoveDraftVertex: (
    vertexIndex: number,
    longitude: number,
    latitude: number,
  ) => void;
  onInsertDraftVertex: (
    insertAtIndex: number,
    longitude: number,
    latitude: number,
  ) => void;
  onUpdateOverlay: (overlay: MapImageOverlay) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
};

export default function MapCanvas({
  geometries,
  imageOverlays,
  selectedId,
  mode,
  draftVertices,
  initialLatitude,
  initialLongitude,
  initialZoom,
  editable = true,
  selectedVertexIndex = null,
  onMapPress,
  onSelectFeature,
  onSelectVertex,
  onMoveVertex,
  onInsertVertex,
  onMoveDraftVertex,
  onInsertDraftVertex,
  onUpdateOverlay,
  zoom,
  onZoomChange,
}: Props) {
  const { theme } = useUnistyles();
  const cameraRef = useRef<CameraRef>(null);

  const layerStack = useMemo(() => {
    const items: LayerStackItem[] = [];
    for (const geometry of geometries) {
      if (!isFeatureVisible(geometry) || geometry.kind === 'Point') {
        continue;
      }
      items.push({
        type: 'geometry',
        id: geometry.id,
        zIndex: geometry.zIndex,
        geometry,
      });
    }
    for (const overlay of imageOverlays) {
      if (!isFeatureVisible(overlay)) {
        continue;
      }
      items.push({
        type: 'overlay',
        id: overlay.id,
        zIndex: overlay.zIndex,
        overlay,
      });
    }
    return items.sort((a, b) => {
      if (a.zIndex !== b.zIndex) {
        return a.zIndex - b.zIndex;
      }
      return a.id.localeCompare(b.id);
    });
  }, [geometries, imageOverlays]);

  /** Remount the GL stack when membership/order changes so z-order stays correct
   * without fragile afterId chains (clearing afterId to null crashes on Android). */
  const layerStackKey = useMemo(
    () => layerStack.map(item => `${item.type}:${item.id}:${item.zIndex}`).join('|'),
    [layerStack],
  );

  const labelCollection = useMemo(() => {
    // Points render their own label under the marker annotation.
    const features = sortGeometriesByZIndex(
      geometries.filter(g => g.kind !== 'Point' && isFeatureVisible(g)),
    )
      .map(g => {
        const displayLabel = getMapDisplayLabel(g);
        if (!displayLabel) {
          return null;
        }
        const center = getGeometryCentroid(g);
        if (!center) {
          return null;
        }
        return {
          type: 'Feature' as const,
          id: g.id,
          properties: {
            id: g.id,
            label: displayLabel,
            color: g.color,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [center.longitude, center.latitude],
          },
        };
      })
      .filter((f): f is NonNullable<typeof f> => f != null);
    return { type: 'FeatureCollection' as const, features };
  }, [geometries]);

  const draftCollection = useMemo(() => {
    if (mode === 'LineString') {
      return draftLineCollection(draftVertices);
    }
    if (mode === 'Polygon') {
      return draftPolygonCollection(draftVertices);
    }
    return { type: 'FeatureCollection' as const, features: [] };
  }, [mode, draftVertices]);

  const pointGeometries = useMemo(
    () =>
      sortGeometriesByZIndex(
        geometries.filter(g => g.kind === 'Point' && isFeatureVisible(g)),
      ),
    [geometries],
  );

  const selectedGeometry = useMemo(
    () => geometries.find(g => g.id === selectedId) ?? null,
    [geometries, selectedId],
  );

  const selectedOverlay = useMemo(
    () => imageOverlays.find(o => o.id === selectedId) ?? null,
    [imageOverlays, selectedId],
  );

  const draftGeometry = useMemo((): MapGeometry | null => {
    if (
      !editable ||
      (mode !== 'LineString' && mode !== 'Polygon') ||
      draftVertices.length === 0
    ) {
      return null;
    }
    return {
      id: '__draft__',
      kind: mode,
      featureType: null,
      coordinates:
        mode === 'LineString'
          ? lineCoordinatesFromVertices(draftVertices)
          : polygonCoordinatesFromVertices(draftVertices),
      color: theme.colors.primary,
      opacity: 1,
      zIndex: 0,
    };
  }, [editable, mode, draftVertices, theme.colors.primary]);

  const canSelectFeatures = mode === 'select';

  const handleMapPress = (event: NativeSyntheticEvent<PressEvent>) => {
    const [longitude, latitude] = event.nativeEvent.lngLat;
    onMapPress(longitude, latitude);
  };

  /** When a vertex is selected, taps on the shape should insert — not re-select. */
  const handleGeometryPress = (
    event: NativeSyntheticEvent<PressEventWithFeatures>,
    geometryId: string,
  ) => {
    if (!canSelectFeatures || selectedOverlay) {
      return;
    }
    event.stopPropagation();
    const [longitude, latitude] = event.nativeEvent.lngLat;

    if (
      editable &&
      selectedVertexIndex != null &&
      selectedId === geometryId
    ) {
      onMapPress(longitude, latitude);
      return;
    }

    const id = event.nativeEvent.features[0]?.properties?.id;
    if (typeof id === 'string') {
      onSelectFeature(id);
    }
  };

  const handleRegionDidChange = (
    event: NativeSyntheticEvent<ViewStateChangeEvent>,
  ) => {
    onZoomChange(event.nativeEvent.zoom);
  };

  const zoomBy = (delta: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
    cameraRef.current?.zoomTo(next, { duration: 200 });
    onZoomChange(next);
  };

  const centerLng = initialLongitude ?? DEFAULT_CENTER.longitude;
  const centerLat = initialLatitude ?? DEFAULT_CENTER.latitude;
  const startZoom =
    initialZoom ??
    (initialLatitude != null && initialLongitude != null
      ? 12
      : DEFAULT_ZOOM);

  return (
    <View style={styles.mapWrap}>
      <Map
        style={styles.map}
        mapStyle={OSM_RASTER_STYLE}
        logo={false}
        compass
        attribution={false}
        scaleBar={false}
        touchZoom
        doubleTapZoom
        touchRotate={false}
        touchPitch={false}
        onPress={handleMapPress}
        onRegionDidChange={handleRegionDidChange}>
        <Camera
          ref={cameraRef}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          initialViewState={{
            center: [centerLng, centerLat],
            zoom: startZoom,
          }}
        />

        {/* Key forces a clean remount when stack order/visibility changes. */}
        <React.Fragment key={layerStackKey || 'empty-stack'}>
          {layerStack.map(item => {
            if (item.type === 'overlay') {
              const { overlay } = item;
              const b = overlay.bounds;
              const hitFeature = {
                type: 'FeatureCollection' as const,
                features: [
                  {
                    type: 'Feature' as const,
                    id: overlay.id,
                    properties: { id: overlay.id },
                    geometry: {
                      type: 'Polygon' as const,
                      coordinates: [
                        [
                          [b.west, b.north],
                          [b.east, b.north],
                          [b.east, b.south],
                          [b.west, b.south],
                          [b.west, b.north],
                        ],
                      ],
                    },
                  },
                ],
              };
              return (
                <React.Fragment key={`stack-overlay-${overlay.id}`}>
                  <ImageSource
                    id={`img-overlay-${overlay.id}`}
                    url={overlay.imageUri}
                    coordinates={boundsToCoordinates(
                      overlay.bounds,
                      overlay.rotation,
                    )}>
                    <Layer
                      id={`img-raster-${overlay.id}`}
                      type="raster"
                      paint={{
                        'raster-opacity': resolveOpacity(overlay),
                      }}
                    />
                  </ImageSource>
                  <GeoJSONSource
                    id={`overlay-hit-${overlay.id}`}
                    data={hitFeature}
                    onPress={event => {
                      if (!canSelectFeatures) {
                        return;
                      }
                      event.stopPropagation();
                      onSelectFeature(overlay.id);
                    }}>
                    <Layer
                      id={`overlay-hit-fill-${overlay.id}`}
                      type="fill"
                      paint={{
                        'fill-color': '#000000',
                        'fill-opacity': 0,
                      }}
                    />
                    {selectedId === overlay.id ? (
                      <Layer
                        id={`overlay-sel-outline-${overlay.id}`}
                        type="line"
                        paint={{
                          'line-color': '#0074D9',
                          'line-width': 2,
                          'line-dasharray': [4, 3],
                        }}
                      />
                    ) : null}
                  </GeoJSONSource>
                </React.Fragment>
              );
            }

            const { geometry } = item;
            const feature = geometryToFeature(geometry);
            if (!feature) {
              return null;
            }
            const collection = {
              type: 'FeatureCollection' as const,
              features: [feature],
            };

            if (geometry.kind === 'Polygon') {
              return (
                <GeoJSONSource
                  key={`stack-geom-${geometry.id}`}
                  id={`geom-source-${geometry.id}`}
                  data={collection}
                  onPress={event => {
                    handleGeometryPress(event, geometry.id);
                  }}>
                  <Layer
                    id={`geom-fill-${geometry.id}`}
                    type="fill"
                    paint={{
                      'fill-color': ['get', 'color'],
                      'fill-opacity': ['get', 'opacity'],
                    }}
                  />
                  <Layer
                    id={`geom-outline-${geometry.id}`}
                    type="line"
                    paint={{
                      'line-color': ['get', 'color'],
                      'line-opacity': 1,
                      'line-width': [
                        'case',
                        ['==', ['get', 'id'], selectedId ?? ''],
                        3,
                        2,
                      ],
                    }}
                  />
                </GeoJSONSource>
              );
            }

            return (
              <GeoJSONSource
                key={`stack-geom-${geometry.id}`}
                id={`geom-source-${geometry.id}`}
                data={collection}
                // Wider hit area — thin lines are otherwise hard to tap.
                hitbox={{ top: 28, right: 28, bottom: 28, left: 28 }}
                onPress={event => {
                  handleGeometryPress(event, geometry.id);
                }}>
                <Layer
                  id={`geom-line-${geometry.id}`}
                  type="line"
                  paint={{
                    'line-color': ['get', 'color'],
                    'line-opacity': ['get', 'opacity'],
                    'line-width': [
                      'case',
                      ['==', ['get', 'id'], selectedId ?? ''],
                      5,
                      3,
                    ],
                  }}
                />
              </GeoJSONSource>
            );
          })}
        </React.Fragment>

        <GeoJSONSource id="geom-label-source" data={labelCollection}>
          <Layer
            id="geom-labels"
            type="symbol"
            layout={{
              'text-field': ['get', 'label'],
              'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
              'text-size': 12,
              'text-offset': [0, 0.4],
              'text-anchor': 'center',
              'text-allow-overlap': true,
              'text-ignore-placement': true,
              'text-max-width': 12,
              'text-line-height': 1.2,
            }}
            paint={{
              'text-color': ['get', 'color'],
              'text-halo-color': '#FFFFFF',
              'text-halo-width': 1.5,
              'text-opacity': 0.95,
            }}
          />
        </GeoJSONSource>

        {draftVertices.length > 0 ? (
          <GeoJSONSource id="geom-draft-source" data={draftCollection}>
            <Layer
              id="geom-draft-fill"
              type="fill"
              filter={['==', ['geometry-type'], 'Polygon']}
              paint={{
                'fill-color': theme.colors.primary,
                'fill-opacity': 0.25,
              }}
            />
            <Layer
              id="geom-draft-line"
              type="line"
              filter={[
                'any',
                ['==', ['geometry-type'], 'LineString'],
                ['==', ['geometry-type'], 'Polygon'],
              ]}
              paint={{
                'line-color': theme.colors.primary,
                'line-width': 2,
                'line-dasharray': [2, 2],
              }}
            />
            <Layer
              id="geom-draft-points"
              type="circle"
              filter={['==', ['geometry-type'], 'Point']}
              paint={{
                'circle-radius': 5,
                'circle-color': theme.colors.primary,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
              }}
            />
          </GeoJSONSource>
        ) : null}

        {pointGeometries.map(point => {
          const [lng, lat] = point.coordinates as number[];
          if (lng == null || lat == null) {
            return null;
          }
          const isSelected = selectedId === point.id;
          const overlayIsSelected = selectedOverlay != null;
          return (
            <PointMarker
              key={point.id}
              point={point}
              longitude={lng}
              latitude={lat}
              selected={isSelected}
              draggable={
                editable &&
                canSelectFeatures &&
                isSelected &&
                !overlayIsSelected
              }
              canSelect={canSelectFeatures && !overlayIsSelected}
              onSelect={() => onSelectFeature(point.id)}
              onMove={(longitude, latitude) =>
                onMoveVertex(point.id, 0, longitude, latitude)
              }
            />
          );
        })}

        {selectedGeometry &&
        isFeatureVisible(selectedGeometry) &&
        (selectedGeometry.kind === 'LineString' ||
          selectedGeometry.kind === 'Polygon') ? (
          <VertexEditHandles
            geometry={selectedGeometry}
            editable={editable}
            selectedVertexIndex={selectedVertexIndex}
            onSelectVertex={onSelectVertex}
            onMoveVertex={onMoveVertex}
            onInsertVertex={onInsertVertex}
          />
        ) : null}

        {draftGeometry ? (
          <VertexEditHandles
            geometry={draftGeometry}
            editable={editable}
            showMidpoints={false}
            onMoveVertex={(_id, vertexIndex, longitude, latitude) =>
              onMoveDraftVertex(vertexIndex, longitude, latitude)
            }
            onInsertVertex={(_id, insertAtIndex, longitude, latitude) =>
              onInsertDraftVertex(insertAtIndex, longitude, latitude)
            }
          />
        ) : null}

        {selectedOverlay &&
        editable &&
        isFeatureVisible(selectedOverlay) ? (
          <OverlayEditHandles
            overlay={selectedOverlay}
            onUpdate={onUpdateOverlay}
          />
        ) : null}
      </Map>

      <Pressable
        onPress={() => {
          cameraRef.current?.flyTo({
            center: [centerLng, centerLat],
            zoom: startZoom,
          });
        }}
        style={styles.locateButton}
        accessibilityRole="button"
        accessibilityLabel="Recenter map">
        <LocateFixed size={16} color={theme.colors.text} />
      </Pressable>

      <View style={styles.zoomControls} pointerEvents="box-none">
        <Pressable
          style={[
            styles.zoomButton,
            zoom >= MAX_ZOOM && styles.zoomButtonDisabled,
          ]}
          onPress={() => zoomBy(ZOOM_STEP)}
          disabled={zoom >= MAX_ZOOM}
          accessibilityRole="button"
          accessibilityLabel="Zoom in">
          <Plus size={16} color={theme.colors.text} />
        </Pressable>
        <Pressable
          style={[
            styles.zoomButton,
            zoom <= MIN_ZOOM && styles.zoomButtonDisabled,
          ]}
          onPress={() => zoomBy(-ZOOM_STEP)}
          disabled={zoom <= MIN_ZOOM}
          accessibilityRole="button"
          accessibilityLabel="Zoom out">
          <Minus size={16} color={theme.colors.text} />
        </Pressable>
      </View>

      {!editable ? (
        <View style={styles.readOnlyBadge}>
          <Text style={styles.readOnlyText}>View only</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  mapWrap: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  map: {
    flex: 1,
  },
  locateButton: {
    position: 'absolute',
    top: theme.gap(1),
    right: theme.gap(1),
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    zIndex: 5,
  },
  zoomControls: {
    position: 'absolute',
    right: theme.gap(1),
    bottom: theme.gap(1),
    gap: theme.gap(0.5),
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  zoomButtonDisabled: {
    opacity: 0.4,
  },
  pointAnnotation: {
    width: POINT_MARKER_WIDTH,
  },
  markerInner: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    height: '100%',
    paddingBottom: 1,
  },
  markerBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  markerBadgeSelected: {
    borderWidth: 2.5,
  },
  markerLabel: {
    marginBottom: 3,
    maxWidth: POINT_MARKER_WIDTH - 4,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  readOnlyBadge: {
    position: 'absolute',
    top: theme.gap(1),
    left: theme.gap(1),
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.1),
    borderRadius: 12,
  },
  readOnlyText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
}));

type PointMarkerProps = {
  point: MapGeometry;
  longitude: number;
  latitude: number;
  selected: boolean;
  draggable: boolean;
  canSelect: boolean;
  onSelect: () => void;
  onMove: (longitude: number, latitude: number) => void;
};

function PointMarker({
  point,
  longitude,
  latitude,
  selected,
  draggable,
  canSelect,
  onSelect,
  onMove,
}: PointMarkerProps) {
  const annotationRef = useRef<ViewAnnotationRef>(null);
  const draggingRef = useRef(false);
  const [lngLat, setLngLat] = useState<[number, number]>([
    longitude,
    latitude,
  ]);
  const meta = getFeatureTypeMeta(point.featureType);
  const Icon = meta.icon;
  const badgeSize = selected ? POINT_BADGE_SELECTED : POINT_BADGE_SIZE;
  const iconSize = selected ? POINT_ICON_SELECTED : POINT_ICON_SIZE;
  const pointOpacity = resolveOpacity(point);
  const label = point.label?.trim() ?? '';
  const hasLabel = label.length > 0;
  const markerHeight = hasLabel
    ? badgeSize + POINT_LABEL_HEIGHT
    : badgeSize;
  const refreshKey = useMemo(
    () =>
      `${selected}-${point.color}-${point.featureType}-${badgeSize}-${pointOpacity}-${label}`,
    [
      selected,
      point.color,
      point.featureType,
      badgeSize,
      pointOpacity,
      label,
    ],
  );

  useEffect(() => {
    if (draggingRef.current) {
      return;
    }
    setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  return (
    <ViewAnnotation
      ref={annotationRef}
      id={`point-${point.id}`}
      lngLat={lngLat}
      anchor="bottom"
      draggable={draggable}
      style={[styles.pointAnnotation, { height: markerHeight }]}
      onPress={event => {
        if (!canSelect) {
          return;
        }
        event.stopPropagation();
        onSelect();
      }}
      onDragStart={() => {
        if (!draggable) {
          return;
        }
        draggingRef.current = true;
      }}
      onDragEnd={(event: NativeSyntheticEvent<ViewAnnotationEvent>) => {
        if (!draggable) {
          return;
        }
        const [lng, lat] = event.nativeEvent.lngLat;
        draggingRef.current = false;
        setLngLat([lng, lat]);
        onMove(lng, lat);
      }}>
      <AnnotationContent
        width={POINT_MARKER_WIDTH}
        height={markerHeight}
        annotationRef={annotationRef}
        refreshKey={refreshKey}>
        <View style={[styles.markerInner, { opacity: pointOpacity }]}>
          {hasLabel ? (
            <Text
              style={[styles.markerLabel, { color: point.color }]}
              numberOfLines={2}>
              {label}
            </Text>
          ) : null}
          <View
            style={[
              styles.markerBadge,
              selected && styles.markerBadgeSelected,
              {
                width: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
                borderColor: point.color,
              },
            ]}>
            <Icon size={iconSize} color={point.color} />
          </View>
        </View>
      </AnnotationContent>
    </ViewAnnotation>
  );
}
