import { LocationManager } from '@maplibre/maplibre-react-native';

export type LocationPermissionStatus = 'granted' | 'denied' | 'unavailable';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * Requests location access via MapLibre's LocationManager.
 * Android: ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION
 * iOS: when-in-use authorization
 */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const granted = await LocationManager.requestPermissions();
    return granted ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** Returns the device's current coordinates, requesting permission first. */
export async function getCurrentCoordinates(): Promise<Coordinates | null> {
  const status = await requestLocationPermission();
  if (status !== 'granted') {
    return null;
  }

  try {
    const position = await LocationManager.getCurrentPosition();
    if (!position) {
      return null;
    }
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}
