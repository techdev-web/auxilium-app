import React from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import { MapPin } from 'lucide-react-native';
import { OSM_RASTER_STYLE } from '../constants/mapStyle';

type Props = {
  latitude: number;
  longitude: number;
  zoom?: number;
};

/** Non-interactive mini map that shows a single location pin. */
export default function ProjectLocationMap({
  latitude,
  longitude,
  zoom = 13,
}: Props) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container} pointerEvents="none">
      <Map
        style={styles.map}
        mapStyle={OSM_RASTER_STYLE}
        logo={false}
        compass={false}
        attribution={false}
        scaleBar={false}
        dragPan={false}
        touchZoom={false}
        doubleTapZoom={false}
        doubleTapHoldZoom={false}
        touchRotate={false}
        touchPitch={false}>
        <Camera initialViewState={{ center: [longitude, latitude], zoom }} />
        <Marker id="project-pin" lngLat={[longitude, latitude]} anchor="bottom">
          <MapPin
            size={28}
            color={theme.colors.primary}
            fill={theme.colors.primary}
          />
        </Marker>
      </Map>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    height: 140,
    borderRadius: theme.radii.input,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  map: {
    flex: 1,
  },
}));
