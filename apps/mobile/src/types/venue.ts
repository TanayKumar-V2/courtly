import { Sport } from '../auth/auth-types';

export type OwnerApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type VenueStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAUSED';

export type CourtStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface OwnerApplication {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  contactPerson: string;
  contactPhone: string;
  city: string;
  state: string;
  country: string;
  additionalInformation: string;
  status: OwnerApplicationStatus;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerApplicationMeResponse {
  isVenueOwner: boolean;
  canApply: boolean;
  latestApplication: OwnerApplication | null;
  history: OwnerApplication[];
}

export interface AmenityItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  icon: string;
}

export interface VenueImageItem {
  id: string;
  publicId?: string;
  secureUrl: string;
  width: number;
  height: number;
  format?: string;
  bytes?: number;
  position: number;
  isCover: boolean;
  createdAt?: string;
}

export interface CourtItem {
  id: string;
  venueId: string;
  name: string;
  sport: Sport;
  description?: string | null;
  surfaceType?: string | null;
  indoor: boolean;
  maxPlayers: number;
  basePricePerHour: number;
  currency: string;
  status: CourtStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VenueCompletion {
  isReadyToSubmit: boolean;
  completionPercent: number;
  missingRequirements: string[];
  checklist: {
    hasBasicInfo: boolean;
    hasContactInfo: boolean;
    hasCompleteAddress: boolean;
    hasActiveCourt: boolean;
    hasImage: boolean;
    hasAmenity: boolean;
  };
}

export interface OwnerVenue {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  businessContactPhone: string;
  businessContactEmail: string;
  addressLine1: string;
  addressLine2?: string | null;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  currency: string;
  status: VenueStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sports: Sport[];
  courtCount: number;
  activeCourtCount: number;
  startingPricePerHour: number | null;
  coverImage: VenueImageItem | null;
  images: VenueImageItem[];
  courts: CourtItem[];
  amenities: AmenityItem[];
  completion: VenueCompletion;
}

export interface OwnerVenuesSummary {
  total: number;
  draft: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  paused: number;
}

export interface OwnerVenuesListResponse {
  summary: OwnerVenuesSummary;
  venues: OwnerVenue[];
}

export interface PublicVenue {
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
  };
  location: {
    latitude: number | null;
    longitude: number | null;
  };
  timezone: string;
  currency: string;
  publishedAt: string | null;
  sports: Sport[];
  startingPricePerHour: number | null;
  coverImage: VenueImageItem | null;
  images: VenueImageItem[];
  courts: CourtItem[];
  amenities: AmenityItem[];
}

export interface PublicVenuesListResponse {
  data: PublicVenue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SignedUploadSignatureResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  allowedFormats: string[];
  maxFileSizeBytes: number;
  uploadUrl: string;
  remainingSlots: number;
}
