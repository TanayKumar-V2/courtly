import { HealthResponseDto } from '@courtly/shared';
import { apiClient, ApiError, getApiBaseUrl } from './api-client';

export { ApiError, getApiBaseUrl };

export const apiService = {
  /**
   * Fetches health status from NestJS backend /api/health
   */
  async getHealth(): Promise<HealthResponseDto> {
    return apiClient<HealthResponseDto>('/health');
  },
};
