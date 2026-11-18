import { useVenueSearch } from './useVenueSearch';
import { DEFAULT_DISCOVERY_FILTERS, DiscoveryFilters } from '../types/discovery.types';

export function useNearbyVenues(
  latitude?: number,
  longitude?: number,
  radiusKm = 10,
  extraFilters: Partial<DiscoveryFilters> = {},
) {
  const filters: DiscoveryFilters = {
    ...DEFAULT_DISCOVERY_FILTERS,
    ...extraFilters,
    latitude,
    longitude,
    radiusKm,
    sort: latitude !== undefined && longitude !== undefined ? 'DISTANCE' : 'NEWEST',
  };

  return useVenueSearch(filters);
}
