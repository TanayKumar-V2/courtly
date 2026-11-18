import { apiClient } from './api-client';
import { Sport } from '../auth/auth-types';
import { CourtItem, CourtStatus } from '../types/venue';

export interface CreateCourtPayload {
  name: string;
  sport: Sport;
  description?: string;
  surfaceType?: string;
  indoor?: boolean;
  maxPlayers: number;
  basePricePerHour: number;
  currency?: string;
  status?: CourtStatus;
}

export interface UpdateCourtPayload extends Partial<CreateCourtPayload> {}

export const courtService = {
  async list(venueId: string): Promise<{ venueId: string; courts: CourtItem[] }> {
    return apiClient(`/owner/venues/${venueId}/courts`);
  },

  async create(
    venueId: string,
    payload: CreateCourtPayload,
  ): Promise<{ message: string; court: CourtItem }> {
    return apiClient(`/owner/venues/${venueId}/courts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(
    venueId: string,
    courtId: string,
    payload: UpdateCourtPayload,
  ): Promise<{ message: string; court: CourtItem }> {
    return apiClient(`/owner/venues/${venueId}/courts/${courtId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async remove(
    venueId: string,
    courtId: string,
  ): Promise<{ message: string; archived: boolean }> {
    return apiClient(`/owner/venues/${venueId}/courts/${courtId}`, {
      method: 'DELETE',
    });
  },
};
