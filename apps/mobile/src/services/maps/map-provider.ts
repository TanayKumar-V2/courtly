import { Linking, Platform } from 'react-native';
import { MAP_CONFIG, OPENFREEMAP_STYLES } from './map-config';
import {
  MapBounds,
  VenueMapMarkerItem,
} from '../../features/discovery/types/discovery.types';

export interface GeoJsonVenueProperties {
  id: string;
  name: string;
  sport: string;
  sportsLabel: string;
  startingPricePerHour: string | null;
  priceLabel: string;
  currency: string;
  city: string;
  locality: string;
  latitude: number;
  longitude: number;
  activeCourtCount: number;
  isSelected: boolean;
}

export interface GeoJsonVenueFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    /** Strict GeoJSON coordinate order: [longitude, latitude] */
    coordinates: [number, number];
  };
  properties: GeoJsonVenueProperties;
}

export interface GeoJsonVenueFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonVenueFeature[];
}

export interface MapProviderAdapter {
  readonly name: string;
  getPrimaryStyleUrl(): string;
  getFallbackStyleUrl(): string;
  getAttributionText(): string;
}

/**
 * Swappable map provider abstraction backed by OpenFreeMap hosted vector styles.
 * Allows switching to another OpenStreetMap-derived tile provider without touching UI components.
 */
export const mapProvider: MapProviderAdapter = {
  name: MAP_CONFIG.providerName,
  getPrimaryStyleUrl() {
    return MAP_CONFIG.defaultStyleUrl;
  },
  getFallbackStyleUrl() {
    return MAP_CONFIG.fallbackStyleUrl || OPENFREEMAP_STYLES.liberty;
  },
  getAttributionText() {
    return MAP_CONFIG.attribution.fullText;
  },
};

/**
 * Converts API venue marker items into a strict GeoJSON FeatureCollection.
 * Guarantees [longitude, latitude] coordinate ordering and skips invalid coordinates.
 */
export function venuesToGeoJson(
  venues: VenueMapMarkerItem[],
  selectedVenueId: string | null = null,
): GeoJsonVenueFeatureCollection {
  const features: GeoJsonVenueFeature[] = [];

  for (const venue of venues) {
    if (
      typeof venue.latitude !== 'number' ||
      typeof venue.longitude !== 'number' ||
      Number.isNaN(venue.latitude) ||
      Number.isNaN(venue.longitude) ||
      venue.latitude < -90 ||
      venue.latitude > 90 ||
      venue.longitude < -180 ||
      venue.longitude > 180
    ) {
      continue;
    }

    const priceLabel = venue.startingPricePerHour
      ? `${venue.currency === 'INR' ? '₹' : `${venue.currency} `}${Number(venue.startingPricePerHour).toFixed(0)}`
      : `${venue.activeCourtCount}C`;

    features.push({
      type: 'Feature',
      id: venue.id,
      geometry: {
        type: 'Point',
        coordinates: [venue.longitude, venue.latitude],
      },
      properties: {
        id: venue.id,
        name: venue.name,
        sport: venue.sports[0] || 'OTHER',
        sportsLabel: venue.sports.join(' • '),
        startingPricePerHour: venue.startingPricePerHour,
        priceLabel,
        currency: venue.currency,
        city: venue.city,
        locality: venue.locality,
        latitude: venue.latitude,
        longitude: venue.longitude,
        activeCourtCount: venue.activeCourtCount,
        isSelected: venue.id === selectedVenueId,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Converts MapLibre v11 LngLatBounds ([west, south, east, north]) into Courtly API MapBounds.
 */
export function lngLatBoundsToApiBounds(
  bounds: [number, number, number, number],
): MapBounds {
  const [west, south, east, north] = bounds;
  return {
    north: Math.min(90, Math.max(-90, north)),
    south: Math.min(90, Math.max(-90, south)),
    east: Math.min(180, Math.max(-180, east)),
    west: Math.min(180, Math.max(-180, west)),
  };
}

/**
 * Opens native OS maps / OpenStreetMap navigation without Google Directions/Maps API keys.
 */
export async function openExternalMapNavigation(
  latitude: number,
  longitude: number,
  label: string,
): Promise<void> {
  const encodedLabel = encodeURIComponent(label);
  const nativeGeoUrl =
    Platform.OS === 'android'
      ? `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`
      : `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  const canOpen = await Linking.canOpenURL(nativeGeoUrl);
  if (canOpen) {
    await Linking.openURL(nativeGeoUrl);
  } else {
    await Linking.openURL(
      `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
    );
  }
}
