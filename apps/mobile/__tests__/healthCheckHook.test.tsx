import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHealthCheck } from '../src/hooks/useHealthCheck';
import { apiService } from '../src/services/api';

jest.mock('../src/services/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useHealthCheck Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles connected API response with ok status', async () => {
    const mockHealth = {
      status: 'ok' as const,
      service: 'courtly-api',
      dependencies: { redis: 'connected' as const },
      timestamp: '2026-11-15T00:00:00.000Z',
    };
    (apiService.getHealth as jest.Mock).mockResolvedValue(mockHealth);

    const { result } = renderHook(() => useHealthCheck(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });

    expect(result.current.data?.service).toBe('courtly-api');
    expect(result.current.data?.status).toBe('ok');
    expect(result.current.data?.dependencies.redis).toBe('connected');
  });

  it('handles API failure and sets connectionStatus to unavailable', async () => {
    (apiService.getHealth as jest.Mock).mockRejectedValue(
      new Error('Failed to reach backend'),
    );

    const { result } = renderHook(() => useHealthCheck(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('unavailable');
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });
});
