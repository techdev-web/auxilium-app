import React, { useEffect, useRef, useState, type ReactElement } from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  ViewAnnotation,
  type ViewAnnotationEvent,
  type ViewAnnotationRef,
} from '@maplibre/maplibre-react-native';
import {
  getEditableVertices,
  getMidpointHandles,
} from '../../utils/mapGeometryLayers';
import type { MapGeometry } from '../../types/mapGeometry';
import AnnotationContent from './AnnotationContent';

const HANDLE_SIZE = 44;
/** Ignore sub-pixel drag noise so a tap still counts as a press. */
const TAP_MOVE_THRESHOLD_DEG = 0.00005;

type Props = {
  geometry: MapGeometry;
  editable?: boolean;
  /** When false, only vertex handles are shown (useful while drawing a draft). */
  showMidpoints?: boolean;
  selectedVertexIndex?: number | null;
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
};

/**
 * Vertex + midpoint handles for a selected line/polygon.
 * Tap a vertex to select it. Drag a selected vertex to move it.
 * Tap or drag a midpoint to insert a vertex.
 */
export default function VertexEditHandles({
  geometry,
  editable = true,
  showMidpoints = true,
  selectedVertexIndex = null,
  onSelectVertex,
  onMoveVertex,
  onInsertVertex,
}: Props) {
  const { theme } = useUnistyles();

  if (!editable || geometry.kind === 'Point') {
    return null;
  }

  const vertices = getEditableVertices(geometry);
  const midpoints = showMidpoints ? getMidpointHandles(geometry) : [];

  return (
    <>
      {vertices.map((vertex, index) => {
        const selected = selectedVertexIndex === index;
        return (
          <DraggableHandle
            key={`vertex-${geometry.id}-${index}`}
            id={`vertex-${geometry.id}-${index}`}
            longitude={vertex[0]}
            latitude={vertex[1]}
            refreshKey={`${geometry.id}:${index}:${selected ? 1 : 0}`}
            onPress={() => onSelectVertex?.(index)}
            onDragEnd={(longitude, latitude) => {
              onSelectVertex?.(index);
              onMoveVertex(geometry.id, index, longitude, latitude);
            }}>
            <View style={styles.vertexVisual} pointerEvents="none">
              {/* Always mounted so Android bitmap layout stays stable. */}
              <View
                style={[
                  styles.vertexRing,
                  {
                    opacity: selected ? 1 : 0,
                    borderColor: theme.colors.secondary,
                  },
                ]}
              />
              <View
                style={[
                  styles.vertexHandle,
                  {
                    backgroundColor: geometry.color,
                    borderColor: selected
                      ? theme.colors.secondary
                      : theme.colors.background,
                    borderWidth: selected ? 3 : 2.5,
                  },
                ]}
              />
            </View>
          </DraggableHandle>
        );
      })}

      {midpoints.map(mid => (
        <DraggableHandle
          key={`mid-${geometry.id}-${mid.insertAtIndex}`}
          id={`mid-${geometry.id}-${mid.insertAtIndex}`}
          longitude={mid.longitude}
          latitude={mid.latitude}
          onPress={() =>
            onInsertVertex(
              geometry.id,
              mid.insertAtIndex,
              mid.longitude,
              mid.latitude,
            )
          }
          onDragEnd={(longitude, latitude) =>
            onInsertVertex(
              geometry.id,
              mid.insertAtIndex,
              longitude,
              latitude,
            )
          }>
          <View
            style={[
              styles.midpointHandle,
              {
                borderColor: geometry.color,
                backgroundColor: theme.colors.background,
              },
            ]}
            pointerEvents="none"
          />
        </DraggableHandle>
      ))}
    </>
  );
}

type DraggableHandleProps = {
  id: string;
  longitude: number;
  latitude: number;
  refreshKey?: string | number | boolean | null;
  onPress?: () => void;
  onDragEnd: (longitude: number, latitude: number) => void;
  children: ReactElement;
};

/**
 * Keeps `lngLat` stable while a drag is in progress. Parent re-renders (zoom,
 * selection UI, etc.) otherwise push a fresh coordinate array into the native
 * annotation and MapLibre snaps it back to the pre-drag position.
 *
 * Tiny movements are treated as taps so selection stays reliable on draggable
 * annotations where native onPress is intermittent.
 */
function DraggableHandle({
  id,
  longitude,
  latitude,
  refreshKey,
  onPress,
  onDragEnd,
  children,
}: DraggableHandleProps) {
  const draggingRef = useRef(false);
  const dragStartRef = useRef<[number, number] | null>(null);
  const pressHandledInDragRef = useRef(false);
  const annotationRef = useRef<ViewAnnotationRef>(null);
  const [lngLat, setLngLat] = useState<[number, number]>([
    longitude,
    latitude,
  ]);

  useEffect(() => {
    if (draggingRef.current) {
      return;
    }
    setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  return (
    <ViewAnnotation
      ref={annotationRef}
      id={id}
      lngLat={lngLat}
      anchor="center"
      draggable
      style={styles.annotation}
      onPress={event => {
        event.stopPropagation();
        if (pressHandledInDragRef.current) {
          pressHandledInDragRef.current = false;
          return;
        }
        onPress?.();
      }}
      onDragStart={() => {
        draggingRef.current = true;
        pressHandledInDragRef.current = false;
        dragStartRef.current = lngLat;
      }}
      onDragEnd={(event: NativeSyntheticEvent<ViewAnnotationEvent>) => {
        const [lng, lat] = event.nativeEvent.lngLat;
        const start = dragStartRef.current;
        draggingRef.current = false;
        dragStartRef.current = null;

        const moved =
          start != null &&
          Math.hypot(lng - start[0], lat - start[1]) > TAP_MOVE_THRESHOLD_DEG;

        if (!moved) {
          // Snap back and treat as a tap — native onPress often does not fire
          // after a micro-drag on ViewAnnotation.
          if (start) {
            setLngLat(start);
          }
          pressHandledInDragRef.current = true;
          onPress?.();
          return;
        }

        setLngLat([lng, lat]);
        onDragEnd(lng, lat);
      }}>
      <AnnotationContent
        key={String(refreshKey ?? id)}
        width={HANDLE_SIZE}
        height={HANDLE_SIZE}
        annotationRef={annotationRef}
        refreshKey={refreshKey ?? id}>
        {children}
      </AnnotationContent>
    </ViewAnnotation>
  );
}

const styles = StyleSheet.create(_theme => ({
  annotation: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
  },
  vertexVisual: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Soft outer ring — same footprint whether selected or not. */
  vertexRing: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  vertexHandle: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  midpointHandle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    opacity: 0.9,
  },
}));
