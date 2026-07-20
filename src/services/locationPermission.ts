import { LocationManager } from '@maplibre/maplibre-react-native';

export type LocationPermissionStatus = 'granted' | 'denied' | 'unavailable';

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
