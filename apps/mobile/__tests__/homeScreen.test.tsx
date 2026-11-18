import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeScreen from '../app/(app)/(tabs)/index';
import { apiService } from '../src/services/api';

jest.mock('../src/services/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('HomeScreen Component', () => {
  beforeEach(() => {
    (apiService.getHealth as jest.Mock).mockResolvedValue({
      status: 'ok',
      service: 'courtly-api',
      dependencies: { redis: 'connected' },
      timestamp: '2026-11-15T00:00:00.000Z',
    });
  });

  it('renders Courtly branding and hero sections', () => {
    const { getByText } = render(<HomeScreen />, {
      wrapper: createWrapper(),
    });

    // Branding
    expect(getByText('COURT')).toBeTruthy();
    expect(getByText('LY')).toBeTruthy();

    // Section headers
    expect(getByText('Sports Categories')).toBeTruthy();
    expect(getByText('Featured Venues')).toBeTruthy();
    expect(getByText('Nearby Open Games')).toBeTruthy();

    // Matchmaker card (regex to match nested text)
    expect(getByText(/Missing Players/i)).toBeTruthy();
    expect(getByText('Explore Games')).toBeTruthy();
  });
});
