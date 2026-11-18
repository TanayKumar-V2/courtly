import type * as MapLibreTypes from '@maplibre/maplibre-react-native';

export type MapLibreModule = typeof MapLibreTypes;

let cachedModule: MapLibreModule | null | undefined;

/**
 * Safely loads @maplibre/maplibre-react-native at runtime.
 *
 * MapLibre v11 registers native TurboModules (e.g. MLRNCameraModule) at import time.
 * In Expo Go (which does not bundle custom native modules), a top-level static import
 * would crash Expo Router route loading. Lazy guarded loading keeps Discover list,
 * Venue Details, and Owner screens fully operational in Expo Go while enabling full
 * native MapLibre rendering in Android Development Builds.
 */
export function getMapLibreModule(): MapLibreModule | null {
  if (cachedModule !== undefined) {
    return cachedModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@maplibre/maplibre-react-native') as Partial<MapLibreModule>;
    if (Boolean(mod?.Map) && Boolean(mod?.Camera) && Boolean(mod?.GeoJSONSource) && Boolean(mod?.Layer)) {
      cachedModule = mod as MapLibreModule;
      return cachedModule;
    }
    cachedModule = null;
    return null;
  } catch {
    cachedModule = null;
    return null;
  }
}
