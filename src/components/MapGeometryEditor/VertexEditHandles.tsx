import React, { useEffect, useRef, useState, type ReactElement } from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  ViewAnnotation,
  type ViewAnnotationEvent,
} from '@maplibre/maplibre-react-native';
import {
  getEditableVertices,
  getMidpointHandles,
} from '../../utils/mapGeometryLayers';
import type { MapGeometry } from '../../types/mapGeometry';

const HANDLE_SIZE = 44;

type Props = {
  geometry: MapGeometry;
  editable?: boolean;
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
 * Long-press a vertex to drag it. Tap or long-press-drag a midpoint to insert a vertex.
 *
 * Coordinates are only committed on drag end: MapLibre repositions the native
 * annotation whenever `lngLat` changes, so updating it mid-gesture cancels the drag.
 */
export default function VertexEditHandles({
  geometry,
  editable = true,
  onMoveVertex,
  onInsertVertex,
}: Props) {
  const { theme } = useUnistyles();

  if (!editable || geometry.kind === 'Point') {
    return null;
  }

  const vertices = getEditableVertices(geometry);
  const midpoints = getMidpointHandles(geometry);

  return (
    <>
      {vertices.map((vertex, index) => (
        <DraggableHandle
          key={`vertex-${geometry.id}-${index}`}
          id={`vertex-${geometry.id}-${index}`}
          longitude={vertex[0]}
          latitude={vertex[1]}
          onDragEnd={(longitude, latitude) =>
            onMoveVertex(geometry.id, index, longitude, latitude)
          }>
          <View
            style={[
              styles.vertexHandle,
              {
                backgroundColor: geometry.color,
                borderColor: theme.colors.background,
              },
            ]}
          />
        </DraggableHandle>
      ))}

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
  onPress?: () => void;
  onDragEnd: (longitude: number, latitude: number) => void;
  children: ReactElement;
};

/**
 * Keeps `lngLat` stable while a drag is in progress. Parent re-renders (zoom,
 * selection UI, etc.) otherwise push a fresh coordinate array into the native
 * annotation and MapLibre snaps it back to the pre-drag position.
 */
function DraggableHandle({
  id,
  longitude,
  latitude,
  onPress,
  onDragEnd,
  children,
}: DraggableHandleProps) {
  const draggingRef = useRef(false);
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
      id={id}
      lngLat={lngLat}
      anchor="center"
      draggable
      style={styles.annotation}
      onPress={event => {
        event.stopPropagation();
        onPress?.();
      }}
      onDragStart={() => {
        draggingRef.current = true;
      }}
      onDragEnd={(event: NativeSyntheticEvent<ViewAnnotationEvent>) => {
        const [lng, lat] = event.nativeEvent.lngLat;
        draggingRef.current = false;
        setLngLat([lng, lat]);
        onDragEnd(lng, lat);
      }}>
      <View collapsable={false} style={styles.hitArea}>
        {children}
      </View>
    </ViewAnnotation>
  );
}

const styles = StyleSheet.create(_theme => ({
  annotation: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
  },
  /** Annotation hit testing uses the rendered view bounds, so keep it thumb-sized. */
  hitArea: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  vertexHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
  },
  midpointHandle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    opacity: 0.9,
  },
}));
