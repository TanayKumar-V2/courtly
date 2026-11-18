import { useQuery } from '@tanstack/react-query';
import { getVenueMapMarkers } from '../services/discovery-service';
import { DiscoveryFilters, MapBounds } from '../types/discovery.types';

export function useVenueMap(
  bounds: MapBounds | null,
  filters: Partial<DiscoveryFilters>,
  enabled = true,
) {
  return useQuery({
    queryKey: ['discovery', 'venue-map', bounds, filters],
    queryFn: ({ signal }) => getVenueMapMarkers(bounds!, filters, signal),
    enabled: enabled && Boolean(bounds),
    staleTime: 30_000,
  });
}
