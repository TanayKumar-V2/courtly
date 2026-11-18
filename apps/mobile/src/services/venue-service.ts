import { apiClient } from './api-client';
import { Sport } from '../auth/auth-types';
import {
  CourtItem,
  OwnerVenue,
  OwnerVenuesListResponse,
  PublicVenue,
  PublicVenuesListResponse,
  VenueStatus,
} from '../types/venue';

export interface CreateVenuePayload {
  name: string;
  description?: string;
  businessContactPhone?: string;
  businessContactEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  currency?: string;
}

export interface UpdateVenuePayload extends Partial<CreateVenuePayload> {}

export interface PublicVenuesQueryParams {
  page?: number;
  limit?: number;
  city?: string;
  sport?: Sport;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  search?: string;
}

export const venueService = {
  // Owner endpoints
  async createDraft(
    payload: CreateVenuePayload,
  ): Promise<{ message: string; venue: OwnerVenue }> {
    return apiClient('/owner/venues', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listOwnerVenues(status?: VenueStatus): Promise<OwnerVenuesListResponse> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient<OwnerVenuesListResponse>(`/owner/venues${query}`);
  },

  async getOwnerVenue(venueId: string): Promise<{ venue: OwnerVenue }> {
    return apiClient<{ venue: OwnerVenue }>(`/owner/venues/${venueId}`);
  },

  async updateOwnerVenue(
    venueId: string,
    payload: UpdateVenuePayload,
  ): Promise<{ message: string; reReviewTriggered: boolean; venue: OwnerVenue }> {
    return apiClient(`/owner/venues/${venueId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteOrArchiveVenue(
    venueId: string,
  ): Promise<{ message: string; archived: boolean }> {
    return apiClient(`/owner/venues/${venueId}`, {
      method: 'DELETE',
    });
  },

  async submitForReview(
    venueId: string,
  ): Promise<{ message: string; venue: OwnerVenue }> {
    return apiClient(`/owner/venues/${venueId}/submit`, {
      method: 'PATCH',
    });
  },

  async withdrawSubmission(
    venueId: string,
  ): Promise<{ message: string; venue: OwnerVenue }> {
    return apiClient(`/owner/venues/${venueId}/withdraw`, {
      method: 'PATCH',
    });
  },

  // Public approved endpoints
  async listPublicVenues(
    params: PublicVenuesQueryParams = {},
  ): Promise<PublicVenuesListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.city) searchParams.set('city', params.city);
    if (params.sport) searchParams.set('sport', params.sport);
    if (params.minPrice !== undefined)
      searchParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined)
      searchParams.set('maxPrice', String(params.maxPrice));
    if (params.amenities && params.amenities.length > 0) {
      searchParams.set('amenities', params.amenities.join(','));
    }
    if (params.search) searchParams.set('search', params.search);

    const qs = searchParams.toString();
    return apiClient<PublicVenuesListResponse>(`/venues${qs ? `?${qs}` : ''}`);
  },

  async getPublicVenue(venueId: string): Promise<{ venue: PublicVenue }> {
    return apiClient<{ venue: PublicVenue }>(`/venues/${venueId}`);
  },

  async getPublicVenueCourts(
    venueId: string,
  ): Promise<{ venueId: string; venueName: string; currency: string; courts: CourtItem[] }> {
    return apiClient(`/venues/${venueId}/courts`);
  },
};
