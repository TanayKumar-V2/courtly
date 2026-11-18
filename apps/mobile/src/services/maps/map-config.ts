/**
 * Centralized OpenFreeMap & MapLibre vector map configuration for Courtly.
 *
 * Zero API keys, zero Google Cloud billing, zero Google Maps dependencies.
 * Tile data © OpenStreetMap contributors, vector schema © OpenMapTiles,
 * hosted styles provided by OpenFreeMap (https://openfreemap.org/).
 */

export const OPENFREEMAP_STYLES = {
  /** Default Courtly dark vector style complementing #0B1110 / #151D1A / #C6F36B */
  dark: 'https://tiles.openfreemap.org/styles/dark',
  /** Documented OpenFreeMap Liberty fallback style */
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
} as const;

export type MapStyleKey = keyof typeof OPENFREEMAP_STYLES;

export const MAP_CONFIG = {
  providerName: 'OpenFreeMap',
  defaultStyleUrl:
    process.env.EXPO_PUBLIC_MAP_STYLE_URL?.trim() || OPENFREEMAP_STYLES.dark,
  fallbackStyleUrl: OPENFREEMAP_STYLES.liberty,
  attribution: {
    osm: '© OpenStreetMap contributors',
    openMapTiles: '© OpenMapTiles',
    provider: 'OpenFreeMap',
    fullText: '© OpenStreetMap contributors • © OpenMapTiles • OpenFreeMap',
  },
  defaultCenter: {
    /** GeoJSON order: [longitude, latitude] — centered over India */
    longitude: 78.9629,
    latitude: 20.5937,
  },
  defaultZoom: 4.5,
  cityFocusZoom: 12,
  venueDetailZoom: 15,
  clusterRadius: 48,
  clusterMaxZoom: 14,
} as const;
