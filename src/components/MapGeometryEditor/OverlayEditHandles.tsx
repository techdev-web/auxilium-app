import React, { useEffect, useRef, useState } from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  ViewAnnotation,
  type ViewAnnotationEvent,
} from '@maplibre/maplibre-react-native';
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Move,
  RotateCw,
} from 'lucide-react-native';
import type { MapImageOverlay, ImageOverlayBounds } from '../../types/mapGeometry';
import { clampBounds } from '../../types/mapGeometry';

const HANDLE_SIZE = 44;

type HandleId =
  | 'center'
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se';

type Props = {
  overlay: MapImageOverlay;
  onUpdate: (next: MapImageOverlay) => void;
};

function handlePosition(
  bounds: ImageOverlayBounds,
  handle: HandleId,
): [number, number] {
  const midLng = (bounds.west + bounds.east) / 2;
  const midLat = (bounds.north + bounds.south) / 2;
  switch (handle) {
    case 'center':
      return [midLng, midLat];
    case 'n':
      return [midLng, bounds.north];
    case 's':
      return [midLng, bounds.south];
    case 'e':
      return [bounds.east, midLat];
    case 'w':
      return [bounds.west, midLat];
    case 'nw':
      return [bounds.west, bounds.north];
    case 'ne':
      return [bounds.east, bounds.north];
    case 'sw':
      return [bounds.west, bounds.south];
    case 'se':
      return [bounds.east, bounds.south];
  }
}

function applyHandleDrag(
  bounds: ImageOverlayBounds,
  handle: HandleId,
  lng: number,
  lat: number,
): ImageOverlayBounds {
  switch (handle) {
    case 'center': {
      const origMidLng = (bounds.west + bounds.east) / 2;
      const origMidLat = (bounds.north + bounds.south) / 2;
      const dLng = lng - origMidLng;
      const dLat = lat - origMidLat;
      return {
        north: bounds.north + dLat,
        south: bounds.south + dLat,
        east: bounds.east + dLng,
        west: bounds.west + dLng,
      };
    }
    case 'n':
      return clampBounds({ ...bounds, north: lat });
    case 's':
      return clampBounds({ ...bounds, south: lat });
    case 'e':
      return clampBounds({ ...bounds, east: lng });
    case 'w':
      return clampBounds({ ...bounds, west: lng });
    case 'nw':
      return clampBounds({ ...bounds, north: lat, west: lng });
    case 'ne':
      return clampBounds({ ...bounds, north: lat, east: lng });
    case 'sw':
      return clampBounds({ ...bounds, south: lat, west: lng });
    case 'se':
      return clampBounds({ ...bounds, south: lat, east: lng });
  }
}

const HANDLES: HandleId[] = [
  'center',
  'n',
  's',
  'e',
  'w',
  'nw',
  'ne',
  'sw',
  'se',
];

function computeRotationAngle(
  bounds: ImageOverlayBounds,
  dragLng: number,
  dragLat: number,
): number {
  const cx = (bounds.west + bounds.east) / 2;
  const cy = (bounds.north + bounds.south) / 2;
  const dx = dragLng - cx;
  const dy = dragLat - cy;
  const angleRad = Math.atan2(dx, dy);
  return (angleRad * 180) / Math.PI;
}

function rotateHandlePosition(bounds: ImageOverlayBounds, rotation: number): [number, number] {
  const cx = (bounds.west + bounds.east) / 2;
  const cy = (bounds.north + bounds.south) / 2;
  const northOffset = (bounds.north - bounds.south) * 0.65;
  const rad = (rotation * Math.PI) / 180;
  return [
    cx + northOffset * Math.sin(rad),
    cy + northOffset * Math.cos(rad),
  ];
}

const HANDLE_ICONS: Record<HandleId, typeof Move> = {
  center: Move,
  n: ArrowUp,
  s: ArrowDown,
  e: ArrowRight,
  w: ArrowLeft,
  nw: ArrowUpLeft,
  ne: ArrowUpRight,
  sw: ArrowDownLeft,
  se: ArrowDownRight,
};

const ICON_SIZE = 14;
const ICON_SIZE_SM = 12;

export default function OverlayEditHandles({ overlay, onUpdate }: Props) {
  const { theme } = useUnistyles();

  const [rotateLng, rotateLat] = rotateHandlePosition(overlay.bounds, overlay.rotation);

  return (
    <>
      {HANDLES.map(handle => {
        const [lng, lat] = handlePosition(overlay.bounds, handle);
        const isCenter = handle === 'center';
        const Icon = HANDLE_ICONS[handle];
        return (
          <DraggableOverlayHandle
            key={`overlay-handle-${overlay.id}-${handle}`}
            id={`overlay-handle-${overlay.id}-${handle}`}
            longitude={lng}
            latitude={lat}
            onDrag={(newLng, newLat) => {
              const nextBounds = applyHandleDrag(
                overlay.bounds,
                handle,
                newLng,
                newLat,
              );
              onUpdate({ ...overlay, bounds: nextBounds });
            }}>
            <View
              style={[
                styles.iconHandle,
                {
                  backgroundColor: isCenter
                    ? theme.colors.primary
                    : theme.colors.background,
                  borderColor: isCenter ? theme.colors.background : '#0074D9',
                },
              ]}>
              <Icon
                size={isCenter ? ICON_SIZE : ICON_SIZE_SM}
                color={isCenter ? theme.colors.background : '#0074D9'}
              />
            </View>
          </DraggableOverlayHandle>
        );
      })}

      <DraggableOverlayHandle
        key={`overlay-rotate-${overlay.id}`}
        id={`overlay-rotate-${overlay.id}`}
        longitude={rotateLng}
        latitude={rotateLat}
        onDrag={(newLng, newLat) => {
          const angle = computeRotationAngle(overlay.bounds, newLng, newLat);
          onUpdate({ ...overlay, rotation: angle });
        }}>
        <View
          style={[
            styles.iconHandle,
            {
              backgroundColor: '#FF6B35',
              borderColor: theme.colors.background,
            },
          ]}>
          <RotateCw size={ICON_SIZE} color={theme.colors.background} />
        </View>
      </DraggableOverlayHandle>
    </>
  );
}

type DraggableOverlayHandleProps = {
  id: string;
  longitude: number;
  latitude: number;
  onDrag: (longitude: number, latitude: number) => void;
  children: React.ReactElement;
};

function DraggableOverlayHandle({
  id,
  longitude,
  latitude,
  onDrag,
  children,
}: DraggableOverlayHandleProps) {
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
      }}
      onDragStart={() => {
        draggingRef.current = true;
      }}
      onDrag={(event: NativeSyntheticEvent<ViewAnnotationEvent>) => {
        const [lng, lat] = event.nativeEvent.lngLat;
        onDrag(lng, lat);
      }}
      onDragEnd={(event: NativeSyntheticEvent<ViewAnnotationEvent>) => {
        const [lng, lat] = event.nativeEvent.lngLat;
        draggingRef.current = false;
        setLngLat([lng, lat]);
        onDrag(lng, lat);
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
  hitArea: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  iconHandle: {
    width: 20,
    height: 20,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
}));
