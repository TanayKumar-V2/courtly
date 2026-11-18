import * as Location from 'expo-location';
import { Linking } from 'react-native';

export interface DeviceCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export type LocationErrorCode =
  | 'PERMISSION_DENIED'
  | 'SERVICES_DISABLED'
  | 'TIMEOUT'
  | 'UNAVAILABLE';

export interface LocationFetchResult {
  ok: boolean;
  coordinates?: DeviceCoordinates;
  errorCode?: LocationErrorCode;
  message?: string;
  canAskAgain?: boolean;
}

const LOCATION_TIMEOUT_MS = 12000;
const LAST_KNOWN_MAX_AGE_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Privacy-first foreground-only device location service.
 * - Never requests permission automatically on app startup.
 * - Never requests background location.
 * - Never persists precise device coordinates to storage.
 */
export const locationService = {
  async getForegroundPermissionStatus(): Promise<Location.LocationPermissionResponse> {
    return Location.getForegroundPermissionsAsync();
  },

  async openDeviceSettings(): Promise<void> {
    await Linking.openSettings();
  },

  async requestCurrentLocation(): Promise<LocationFetchResult> {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return {
          ok: false,
          errorCode: 'SERVICES_DISABLED',
          message:
            'Location services (GPS) are turned off on your device. Enable location in settings or search by city manually.',
        };
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        return {
          ok: false,
          errorCode: 'PERMISSION_DENIED',
          canAskAgain: permission.canAskAgain,
          message:
            'Location permission was not granted. You can still search sports venues manually by city.',
        };
      }

      // Use fresh last known position when available for fast response
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_MAX_AGE_MS,
      });

      if (lastKnown?.coords) {
        return {
          ok: true,
          coordinates: {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            accuracy: lastKnown.coords.accuracy,
          },
        };
      }

      // Fetch current position with timeout guard (supports approximate or precise foreground location)
      const position = await Promise.race<Location.LocationObject>([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('LOCATION_TIMEOUT')),
            LOCATION_TIMEOUT_MS,
          ),
        ),
      ]);

      return {
        ok: true,
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        },
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg === 'LOCATION_TIMEOUT') {
        return {
          ok: false,
          errorCode: 'TIMEOUT',
          message:
            'Fetching your GPS location timed out. Try again outdoors or search by city.',
        };
      }
      return {
        ok: false,
        errorCode: 'UNAVAILABLE',
        message:
          'Unable to determine your current location right now. You can continue using manual city search.',
      };
    }
  },
};
