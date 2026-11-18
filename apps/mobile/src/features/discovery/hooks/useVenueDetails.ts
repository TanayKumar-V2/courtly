import { useQuery } from '@tanstack/react-query';
import { getVenueDetails } from '../services/discovery-service';

export function useVenueDetails(venueId?: string) {
  return useQuery({
    queryKey: ['discovery', 'venue-detail', venueId],
    queryFn: ({ signal }) => getVenueDetails(venueId!, signal),
    enabled: Boolean(venueId),
    staleTime: 30_000,
  });
}
