import { useQuery } from '@tanstack/react-query';
import {
  PublicVenuesQueryParams,
  venueService,
} from '../services/venue-service';

export function usePublicVenues(params: PublicVenuesQueryParams = {}) {
  return useQuery({
    queryKey: ['public', 'venues', params],
    queryFn: () => venueService.listPublicVenues(params),
    staleTime: 30_000,
  });
}

export function usePublicVenueDetail(venueId: string | undefined) {
  return useQuery({
    queryKey: ['public', 'venues', venueId],
    queryFn: () => venueService.getPublicVenue(venueId!),
    enabled: Boolean(venueId),
  });
}
