import { apiClient } from '../../../services/api-client';
import { AmenityItem, OwnerVenue } from '../../../types/venue';
import {
  DiscoveryFilters,
  DiscoverySearchResponse,
  MapBounds,
  PublicVenueDetail,
  VenueMapResponse,
} from '../types/discovery.types';

export interface SearchVenuesParams extends Partial<DiscoveryFilters> {
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export async function searchVenues(
  params: SearchVenuesParams,
): Promise<DiscoverySearchResponse> {
  const sp = new URLSearchParams();

  if (params.q?.trim()) sp.set('q', params.q.trim().slice(0, 100));
  if (params.city?.trim()) sp.set('city', params.city.trim());
  if (params.state?.trim()) sp.set('state', params.state.trim());
  if (params.sport) sp.set('sport', params.sport);
  if (params.amenityIds && params.amenityIds.length > 0) {
    sp.set('amenityIds', params.amenityIds.join(','));
  }
  if (params.minPrice !== undefined) sp.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) sp.set('maxPrice', String(params.maxPrice));
  if (params.indoor !== undefined) sp.set('indoor', String(params.indoor));
  if (params.latitude !== undefined && params.longitude !== undefined) {
    sp.set('latitude', String(params.latitude));
    sp.set('longitude', String(params.longitude));
    if (params.radiusKm !== undefined) {
      sp.set('radiusKm', String(params.radiusKm));
    }
  }
  if (params.sort) {
    // Only request DISTANCE when valid coordinates exist
    if (
      params.sort !== 'DISTANCE' ||
      (params.latitude !== undefined && params.longitude !== undefined)
    ) {
      sp.set('sort', params.sort);
    }
  }
  sp.set('page', String(params.page ?? 1));
  sp.set('pageSize', String(params.pageSize ?? 20));

  return apiClient<DiscoverySearchResponse>(`/venues?${sp.toString()}`, {
    signal: params.signal,
  });
}

export async function getVenueDetails(
  venueId: string,
  signal?: AbortSignal,
): Promise<{ venue: PublicVenueDetail }> {
  return apiClient<{ venue: PublicVenueDetail }>(`/venues/${venueId}`, {
    signal,
  });
}

export async function getVenueMapMarkers(
  bounds: MapBounds,
  filters: Partial<DiscoveryFilters> = {},
  signal?: AbortSignal,
): Promise<VenueMapResponse> {
  const sp = new URLSearchParams();
  sp.set('north', String(bounds.north));
  sp.set('south', String(bounds.south));
  sp.set('east', String(bounds.east));
  sp.set('west', String(bounds.west));

  if (filters.q?.trim()) sp.set('q', filters.q.trim().slice(0, 100));
  if (filters.city?.trim()) sp.set('city', filters.city.trim());
  if (filters.state?.trim()) sp.set('state', filters.state.trim());
  if (filters.sport) sp.set('sport', filters.sport);
  if (filters.amenityIds && filters.amenityIds.length > 0) {
    sp.set('amenityIds', filters.amenityIds.join(','));
  }
  if (filters.minPrice !== undefined)
    sp.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined)
    sp.set('maxPrice', String(filters.maxPrice));
  if (filters.indoor !== undefined) sp.set('indoor', String(filters.indoor));

  return apiClient<VenueMapResponse>(`/venues/map?${sp.toString()}`, {
    signal,
  });
}

export async function getAmenities(): Promise<{ amenities: AmenityItem[] }> {
  return apiClient<{ amenities: AmenityItem[] }>('/amenities');
}

export async function updateVenueLocation(
  venueId: string,
  latitude: number,
  longitude: number,
): Promise<{ message: string; venue: OwnerVenue }> {
  return apiClient(`/owner/venues/${venueId}/location`, {
    method: 'PATCH',
    body: JSON.stringify({ latitude, longitude }),
  });
}
