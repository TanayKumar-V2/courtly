import { Sport } from '../../../auth/auth-types';
import { AmenityItem, CourtItem, VenueImageItem } from '../../../types/venue';

export type VenueSortOption =
  | 'NEWEST'
  | 'PRICE_LOW_TO_HIGH'
  | 'PRICE_HIGH_TO_LOW'
  | 'DISTANCE';

export interface DiscoveryFilters {
  q?: string;
  city?: string;
  state?: string;
  sport?: Sport | null;
  amenityIds: string[];
  minPrice?: number;
  maxPrice?: number;
  indoor?: boolean; // undefined = Any, true = Indoor, false = Outdoor
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sort: VenueSortOption;
}

export interface DiscoveryVenueItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  sports: Sport[];
  coverImage: { secureUrl: string } | null;
  startingPricePerHour: string | null;
  currency: string;
  activeCourtCount: number;
  amenities: AmenityItem[];
  distanceKm: number | null;
}

export interface DiscoverySearchResponse {
  data: DiscoveryVenueItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface VenueMapMarkerItem {
  id: string;
  slug: string;
  name: string;
  locality: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  sports: Sport[];
  activeCourtCount: number;
  startingPricePerHour: string | null;
  currency: string;
  coverImage: { secureUrl: string } | null;
}

export interface VenueMapResponse {
  markers: VenueMapMarkerItem[];
  count: number;
  hasMore: boolean;
}

export interface PublicVenueDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  contact: {
    phone: string;
    email: string;
  };
  address: {
    addressLine1: string;
    addressLine2?: string | null;
    locality: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    formatted?: string;
  };
  location: {
    latitude: number | null;
    longitude: number | null;
  };
  timezone: string;
  currency: string;
  publishedAt: string | null;
  sports: Sport[];
  activeCourtCount: number;
  startingPricePerHour: string | null;
  coverImage: VenueImageItem | null;
  images: VenueImageItem[];
  courts: (CourtItem & { hourlyPriceFormatted?: string })[];
  amenities: AmenityItem[];
}

export const DEFAULT_DISCOVERY_FILTERS: DiscoveryFilters = {
  q: '',
  city: '',
  state: '',
  sport: null,
  amenityIds: [],
  minPrice: undefined,
  maxPrice: undefined,
  indoor: undefined,
  latitude: undefined,
  longitude: undefined,
  radiusKm: 10,
  sort: 'NEWEST',
};
