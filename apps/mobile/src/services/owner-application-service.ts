import { apiClient } from './api-client';
import {
  OwnerApplication,
  OwnerApplicationMeResponse,
} from '../types/venue';

export interface SubmitOwnerApplicationPayload {
  businessName: string;
  businessType: string;
  contactPerson: string;
  contactPhone: string;
  city: string;
  state: string;
  country: string;
  additionalInformation?: string;
}

export const ownerApplicationService = {
  async submit(
    payload: SubmitOwnerApplicationPayload,
  ): Promise<{ message: string; application: OwnerApplication }> {
    return apiClient('/owner-applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMyStatus(): Promise<OwnerApplicationMeResponse> {
    return apiClient<OwnerApplicationMeResponse>('/owner-applications/me');
  },
};
