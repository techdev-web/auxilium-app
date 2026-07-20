import React, { useEffect, useRef, useState } from 'react';
import {
  Modal as RNModal,
  Pressable,
  Text,
  View,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  Camera,
  Map,
  Marker,
  type CameraRef,
  type PressEvent,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import { MapPin, Minus, Plus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { OSM_RASTER_STYLE } from '../constants/mapStyle';
import Button from './Button';

const DEFAULT_CENTER = { latitude: 22.9734, longitude: 78.6569 };
const DEFAULT_ZOOM = 4.5;
const SELECTED_ZOOM = 14;
const MIN_ZOOM = 2;
const MAX_ZOOM = 18;
const ZOOM_STEP = 1;

type Props = {
  visible: boolean;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onClose: () => void;
  onConfirm: (latitude: number, longitude: number) => void;
};

export default function MapCoordinatePicker({
  visible,
  initialLatitude,
  initialLongitude,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const cameraRef = useRef<CameraRef>(null);
  const [zoom, setZoom] = useState(
    initialLatitude != null && initialLongitude != null
      ? SELECTED_ZOOM
      : DEFAULT_ZOOM,
  );
  const [selected, setSelected] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (
      initialLatitude != null &&
      initialLongitude != null &&
      !Number.isNaN(initialLatitude) &&
      !Number.isNaN(initialLongitude)
    ) {
      setSelected({
        latitude: initialLatitude,
        longitude: initialLongitude,
      });
      setZoom(SELECTED_ZOOM);
      return;
    }
    setSelected(null);
    setZoom(DEFAULT_ZOOM);
  }, [visible, initialLatitude, initialLongitude]);

  const handleMapPress = (event: NativeSyntheticEvent<PressEvent>) => {
    const [longitude, latitude] = event.nativeEvent.lngLat;
    setSelected({ latitude, longitude });
  };

  const handleRegionDidChange = (
    event: NativeSyntheticEvent<ViewStateChangeEvent>,
  ) => {
    setZoom(event.nativeEvent.zoom);
  };

  const zoomBy = (delta: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
    cameraRef.current?.zoomTo(next, { duration: 200 });
    setZoom(next);
  };

  const handleConfirm = () => {
    if (!selected) {
      Toast.show({
        type: 'info',
        text1: 'Tap the map to place a pin',
      });
      return;
    }
    onConfirm(selected.latitude, selected.longitude);
  };

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 8,
          },
        ]}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose on map</Text>
          <Text style={styles.subtitle}>
            Tap anywhere on the map to place the pin. Pinch or use + / − to
            zoom.
          </Text>
        </View>

        <View style={styles.mapWrap}>
          {visible ? (
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
                  center: [
                    initialLongitude ?? DEFAULT_CENTER.longitude,
                    initialLatitude ?? DEFAULT_CENTER.latitude,
                  ],
                  zoom:
                    initialLatitude != null && initialLongitude != null
                      ? SELECTED_ZOOM
                      : DEFAULT_ZOOM,
                }}
              />
              {selected ? (
                <Marker
                  id="pick-pin"
                  lngLat={[selected.longitude, selected.latitude]}
                  anchor="bottom">
                  <MapPin
                    size={36}
                    color={theme.colors.primary}
                    fill={theme.colors.primary}
                  />
                </Marker>
              ) : null}
            </Map>
          ) : null}

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
              <Plus size={20} color={theme.colors.text} />
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
              <Minus size={20} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.coords}>
          {selected
            ? `${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}`
            : 'No location selected yet'}
        </Text>

        <View style={styles.actions}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={onClose}
            style={styles.actionButton}
          />
          <Button
            title="Use this location"
            onPress={handleConfirm}
            style={styles.actionButton}
            disabled={!selected}
          />
        </View>
        <Toast />
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.gap(3),
    gap: theme.gap(2),
  },
  header: {
    gap: theme.gap(0.5),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  mapWrap: {
    flex: 1,
    borderRadius: theme.radii.card,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  map: {
    flex: 1,
  },
  zoomControls: {
    position: 'absolute',
    right: theme.gap(1.5),
    bottom: theme.gap(1.5),
    gap: theme.gap(1),
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  zoomButtonDisabled: {
    opacity: 0.4,
  },
  coords: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.gap(1.5),
  },
  actionButton: {
    flex: 1,
  },
}));
