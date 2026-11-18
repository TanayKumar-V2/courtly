import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { ApiConnectionStatus, HealthResponseDto } from '../types';

export interface UseHealthCheckResult {
  data: HealthResponseDto | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  connectionStatus: ApiConnectionStatus;
  refetch: () => void;
}

export function useHealthCheck(): UseHealthCheckResult {
  const query = useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.getHealth(),
    refetchInterval: 30000, // Poll every 30s
  });

  let connectionStatus: ApiConnectionStatus = 'checking';

  if (query.isLoading) {
    connectionStatus = 'checking';
  } else if (query.isSuccess && query.data) {
    connectionStatus = 'connected';
  } else if (query.isError) {
    connectionStatus = 'unavailable';
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    connectionStatus,
    refetch: () => {
      void query.refetch();
    },
  };
}
