export const EARTH_RADIUS_KM = 6371;
export const MAX_SEARCH_RADIUS_KM = 50;

export interface GeoBoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  crossesAntimeridian: boolean;
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Accurate Haversine great-circle distance in kilometres.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}

/**
 * Computes a geographic bounding box pre-filter around (lat, lng) for radiusKm.
 * Handles polar clamping and antimeridian wraparound safely.
 */
export function computeBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number,
): GeoBoundingBox {
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const minLat = Math.max(-90, lat - latDelta);
  const maxLat = Math.min(90, lat + latDelta);

  const cosLat = Math.cos(toRadians(lat));
  if (Math.abs(cosLat) < 1e-6) {
    return {
      minLat,
      maxLat,
      minLng: -180,
      maxLng: 180,
      crossesAntimeridian: false,
    };
  }

  const lngDelta = Math.min(180, latDelta / Math.abs(cosLat));
  let minLng = lng - lngDelta;
  let maxLng = lng + lngDelta;
  let crossesAntimeridian = false;

  if (minLng < -180) {
    minLng += 360;
    crossesAntimeridian = true;
  } else if (maxLng > 180) {
    maxLng -= 360;
    crossesAntimeridian = true;
  }

  return {
    minLat,
    maxLat,
    minLng,
    maxLng,
    crossesAntimeridian,
  };
}
