import { apiClient } from './api-client';
import { AmenityItem } from '../types/venue';

export const amenityService = {
  async listCatalogue(): Promise<{ amenities: AmenityItem[] }> {
    return apiClient<{ amenities: AmenityItem[] }>('/amenities');
  },

  async replaceVenueAmenities(
    venueId: string,
    amenityIds: string[],
  ): Promise<{ venueId: string; amenities: AmenityItem[] }> {
    return apiClient(`/owner/venues/${venueId}/amenities`, {
      method: 'PUT',
      body: JSON.stringify({ amenityIds }),
    });
  },
};
