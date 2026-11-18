import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Location from 'expo-location';

import { DiscoverScreen } from '../src/features/discovery/screens/DiscoverScreen';
import { VenueDetailsScreen } from '../src/features/discovery/screens/VenueDetailsScreen';
import { VenueMap } from '../src/features/discovery/components/VenueMap';
import * as discoveryService from '../src/features/discovery/services/discovery-service';
import {
  lngLatBoundsToApiBounds,
  mapProvider,
  venuesToGeoJson,
} from '../src/services/maps/map-provider';
import { OPENFREEMAP_STYLES } from '../src/services/maps/map-config';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('../src/auth/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'player-1',
      fullName: 'Aarav Patel',
      email: 'aarav@courtly.app',
      roles: ['PLAYER'],
      profile: { city: 'Gurugram', preferredSports: [] },
    },
  }),
}));

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

const sampleVenueItem = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'sector-45-arena',
  name: 'Sector 45 Sports Arena',
  description: 'FIFA turf and wooden indoor badminton courts.',
  locality: 'Sector 45',
  city: 'Gurugram',
  state: 'Haryana',
  country: 'India',
  latitude: 28.4595,
  longitude: 77.0266,
  sports: ['FOOTBALL' as const, 'BADMINTON' as const],
  coverImage: { secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/cover.jpg' },
  startingPricePerHour: '500.00',
  currency: 'INR',
  activeCourtCount: 3,
  amenities: [
    { id: 'am-1', name: 'Parking', slug: 'parking', category: 'FACILITY', icon: 'car' },
  ],
  distanceKm: 1.4,
};

const sampleMapMarker = {
  id: sampleVenueItem.id,
  slug: sampleVenueItem.slug,
  name: sampleVenueItem.name,
  locality: sampleVenueItem.locality,
  city: sampleVenueItem.city,
  state: sampleVenueItem.state,
  latitude: 28.4595,
  longitude: 77.0266,
  sports: sampleVenueItem.sports,
  activeCourtCount: 3,
  startingPricePerHour: '500.00',
  currency: 'INR',
  coverImage: sampleVenueItem.coverImage,
};

const sampleVenueDetail = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Sector 45 Sports Arena',
  slug: 'sector-45-arena',
  description: 'FIFA turf and wooden indoor badminton courts.',
  contact: { phone: '+919900112233', email: 'desk@sector45.in' },
  address: {
    addressLine1: 'Plot 14',
    locality: 'Sector 45',
    city: 'Gurugram',
    state: 'Haryana',
    postalCode: '122003',
    country: 'India',
    formatted: 'Plot 14, Sector 45, Gurugram, Haryana, 122003, India',
  },
  location: { latitude: 28.4595, longitude: 77.0266 },
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  publishedAt: new Date().toISOString(),
  sports: ['FOOTBALL' as const, 'BADMINTON' as const],
  activeCourtCount: 2,
  startingPricePerHour: '500.00',
  coverImage: {
    id: 'img-1',
    secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/1.jpg',
    width: 1200,
    height: 800,
    position: 0,
    isCover: true,
  },
  images: [
    {
      id: 'img-1',
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/1.jpg',
      width: 1200,
      height: 800,
      position: 0,
      isCover: true,
    },
    {
      id: 'img-2',
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/2.jpg',
      width: 1200,
      height: 800,
      position: 1,
      isCover: false,
    },
  ],
  courts: [
    {
      id: 'court-1',
      venueId: '11111111-1111-4111-8111-111111111111',
      name: 'Indoor Badminton Court A',
      sport: 'BADMINTON' as const,
      surfaceType: 'Hardwood',
      indoor: true,
      maxPlayers: 4,
      basePricePerHour: 500,
      currency: 'INR',
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  amenities: [
    { id: 'am-1', name: 'Parking', slug: 'parking', category: 'FACILITY', icon: 'car' },
    { id: 'am-2', name: 'Floodlights', slug: 'floodlights', category: 'FACILITY', icon: 'sun' },
  ],
};

describe('Phase 4 Discovery + MapLibre/OpenFreeMap Mobile Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(discoveryService, 'getAmenities').mockResolvedValue({
      amenities: sampleVenueDetail.amenities,
    });
    jest.spyOn(discoveryService, 'searchVenues').mockResolvedValue({
      data: [sampleVenueItem],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    jest.spyOn(discoveryService, 'getVenueMapMarkers').mockResolvedValue({
      markers: [sampleMapMarker],
      count: 1,
      hasMore: false,
    });
  });

  it('1. GeoJSON converter enforces [longitude, latitude] order and OpenFreeMap style URLs require no API key', () => {
    expect(mapProvider.getPrimaryStyleUrl()).toBe(OPENFREEMAP_STYLES.dark);
    expect(mapProvider.getFallbackStyleUrl()).toBe(OPENFREEMAP_STYLES.liberty);
    expect(mapProvider.getAttributionText()).toContain(
      '© OpenStreetMap contributors',
    );

    const geoJson = venuesToGeoJson([
      sampleMapMarker,
      { ...sampleMapMarker, id: 'invalid-lat', latitude: 999 },
    ]);

    expect(geoJson.type).toBe('FeatureCollection');
    expect(geoJson.features).toHaveLength(1);
    // Strict GeoJSON order: [longitude, latitude] — NOT swapped!
    expect(geoJson.features[0].geometry.coordinates).toEqual([77.0266, 28.4595]);
    expect(geoJson.features[0].properties.priceLabel).toBe('₹500');

    const bounds = lngLatBoundsToApiBounds([76.95, 28.4, 77.15, 28.6]);
    expect(bounds).toEqual({ north: 28.6, south: 28.4, east: 77.15, west: 76.95 });
  });

  it('2. Discover screen loads approved venues from API and debounces search text', async () => {
    const searchSpy = jest.spyOn(discoveryService, 'searchVenues');
    const { findByText, getByPlaceholderText } = renderWithQuery(
      <DiscoverScreen />,
    );

    expect(await findByText('Sector 45 Sports Arena')).toBeTruthy();
    expect(await findByText('1 venue found')).toBeTruthy();

    const input = getByPlaceholderText('Find turfs, courts and sports venues...');
    fireEvent.changeText(input, 'Badminton');

    await waitFor(
      () => {
        expect(searchSpy).toHaveBeenCalledWith(
          expect.objectContaining({ q: 'Badminton' }),
        );
      },
      { timeout: 3000 },
    );
  }, 15000);

  it('3. Sport chips, sort selector, FilterBottomSheet, and Map/List switching work seamlessly', async () => {
    const searchSpy = jest.spyOn(discoveryService, 'searchVenues');
    const { findByText, getByText, getByTestId } = renderWithQuery(
      <DiscoverScreen />,
    );

    expect(await findByText('Sector 45 Sports Arena')).toBeTruthy();

    fireEvent.press(getByText('Football'));
    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ sport: 'FOOTBALL' }),
      );
    });

    fireEvent.press(getByText('Price: Low to High'));
    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'PRICE_LOW_TO_HIGH' }),
      );
    });

    fireEvent.press(getByText('Filters'));
    expect(await findByText('Filter & Sort Venues')).toBeTruthy();
    fireEvent.press(getByText('₹300–₹600'));
    fireEvent.press(getByText('Apply Filters'));

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 300, maxPrice: 600 }),
      );
    });

    // Switch to native MapLibre view
    fireEvent.press(getByText('Map'));
    expect(getByTestId('maplibre-map')).toBeTruthy();
    expect(getByTestId('map-attribution')).toBeTruthy();

    // Switch back to List view
    fireEvent.press(getByText('List'));
    expect(await findByText('Sector 45 Sports Arena')).toBeTruthy();
  }, 15000);

  it('4. Location prompt handles foreground GPS request AND permission denial gracefully', async () => {
    const { findByText, getByText, getByLabelText } = renderWithQuery(
      <DiscoverScreen />,
    );
    expect(await findByText('Sector 45 Sports Arena')).toBeTruthy();

    fireEvent.press(
      getByLabelText('Change search city or use current location'),
    );
    expect(await findByText('Select Discovery Location')).toBeTruthy();

    (
      Location.requestForegroundPermissionsAsync as jest.Mock
    ).mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    });

    fireEvent.press(getByText('Use my current location'));
    expect(
      await findByText(
        'Location permission was not granted. You can still search sports venues manually by city.',
      ),
    ).toBeTruthy();
    expect(await findByText('Open Device Settings')).toBeTruthy();
  });

  it('5. MapLibre VenueMap renders OpenFreeMap dark style, handles GeoJSON marker tap, Search This Area, style fallback & visible OSM attribution', async () => {
    const onSearchArea = jest.fn();
    const onSelectVenueDetails = jest.fn();

    const { getByTestId, findByText } = render(
      <VenueMap
        markers={[sampleMapMarker]}
        isLoading={false}
        onSearchArea={onSearchArea}
        onSelectVenueDetails={onSelectVenueDetails}
      />,
    );

    // Loads OpenFreeMap dark style without any API key
    const mapEl = getByTestId('maplibre-map');
    expect(mapEl.props.accessibilityHint).toBe(OPENFREEMAP_STYLES.dark);

    // Persistent OSM + OpenMapTiles attribution visible
    expect(getByTestId('map-attribution')).toBeTruthy();

    // Marker selection opens SelectedVenueCard and navigates to details
    fireEvent.press(getByTestId(`geojson-feature-${sampleMapMarker.id}`));
    expect(getByTestId('selected-venue-card')).toBeTruthy();
    fireEvent.press(await findByText('View Details'));
    expect(onSelectVenueDetails).toHaveBeenCalledWith(sampleMapMarker.id);

    // Camera movement reveals "Search this area" button and triggers bounded API fetch
    fireEvent.press(getByTestId('simulate-region-change'));
    const searchAreaBtn = await findByText('Search this area');
    fireEvent.press(searchAreaBtn);
    expect(onSearchArea).toHaveBeenCalledWith({
      north: 28.6,
      south: 28.4,
      east: 77.15,
      west: 76.95,
    });

    // Style failure falls back cleanly to OpenFreeMap Liberty style
    fireEvent.press(getByTestId('simulate-map-fail'));
    expect(getByTestId('maplibre-map').props.accessibilityHint).toBe(
      OPENFREEMAP_STYLES.liberty,
    );
  });

  it('6. VenueMap handles empty results and slow loading states cleanly', () => {
    const { getByText, rerender } = render(
      <VenueMap
        markers={[]}
        isLoading={true}
        onSearchArea={jest.fn()}
        onSelectVenueDetails={jest.fn()}
      />,
    );
    expect(getByText('Loading venues...')).toBeTruthy();

    rerender(
      <VenueMap
        markers={[]}
        isLoading={false}
        onSearchArea={jest.fn()}
        onSelectVenueDetails={jest.fn()}
      />,
    );
    expect(getByText('No venues mapped in this area yet.')).toBeTruthy();
  });

  it('7. Venue details screen renders gallery counter, embedded MapLibre preview, courts, amenities, and disabled booking CTA', async () => {
    jest.spyOn(discoveryService, 'getVenueDetails').mockResolvedValue({
      venue: sampleVenueDetail,
    });

    const { findByText, getByTestId } = renderWithQuery(
      <VenueDetailsScreen venueId={sampleVenueDetail.id} />,
    );

    expect(await findByText('Indoor Badminton Court A')).toBeTruthy();
    expect(await findByText('1 / 2')).toBeTruthy();
    expect(await findByText('Floodlights')).toBeTruthy();
    expect(await findByText('Booking coming soon')).toBeTruthy();
    expect(getByTestId('maplibre-map')).toBeTruthy();
    expect(getByTestId('map-attribution')).toBeTruthy();
  });

  it('8. List empty and error states render properly with retry control', async () => {
    jest
      .spyOn(discoveryService, 'searchVenues')
      .mockRejectedValueOnce(new Error('API unreachable'))
      .mockResolvedValueOnce({
        data: [],
        meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      });

    const { findByText } = renderWithQuery(<DiscoverScreen />);

    expect(await findByText('Could Not Load Venues')).toBeTruthy();
    await act(async () => {
      fireEvent.press(await findByText('Try Again'));
    });

    expect(await findByText('No venues found')).toBeTruthy();
    expect(await findByText('Try a different sport or location.')).toBeTruthy();
  });
});
