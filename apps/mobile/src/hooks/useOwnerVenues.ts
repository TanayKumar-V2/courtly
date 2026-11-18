import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateVenuePayload,
  UpdateVenuePayload,
  venueService,
} from '../services/venue-service';
import {
  courtService,
  CreateCourtPayload,
  UpdateCourtPayload,
} from '../services/court-service';
import { amenityService } from '../services/amenity-service';
import {
  LocalImageFile,
  venueImageService,
} from '../services/venue-image-service';
import { VenueStatus } from '../types/venue';

export const OWNER_VENUES_KEY = ['owner', 'venues'];
export const ownerVenueKey = (venueId: string) => ['owner', 'venues', venueId];
export const AMENITIES_CATALOGUE_KEY = ['amenities', 'catalogue'];

export function useOwnerVenues(status?: VenueStatus, enabled = true) {
  return useQuery({
    queryKey: [...OWNER_VENUES_KEY, status ?? 'ALL'],
    queryFn: () => venueService.listOwnerVenues(status),
    enabled,
  });
}

export function useOwnerVenue(venueId: string | undefined) {
  return useQuery({
    queryKey: ownerVenueKey(venueId || ''),
    queryFn: () => venueService.getOwnerVenue(venueId!),
    enabled: Boolean(venueId),
  });
}

export function useCreateOwnerVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVenuePayload) =>
      venueService.createDraft(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
    },
  });
}

export function useUpdateOwnerVenue(venueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVenuePayload) =>
      venueService.updateOwnerVenue(venueId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
      queryClient.invalidateQueries({ queryKey: ownerVenueKey(venueId) });
    },
  });
}

export function useDeleteOwnerVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (venueId: string) => venueService.deleteOrArchiveVenue(venueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
    },
  });
}

export function useSubmitVenueForReview(venueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => venueService.submitForReview(venueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
      queryClient.invalidateQueries({ queryKey: ownerVenueKey(venueId) });
    },
  });
}

export function useWithdrawVenueSubmission(venueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => venueService.withdrawSubmission(venueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
      queryClient.invalidateQueries({ queryKey: ownerVenueKey(venueId) });
    },
  });
}

export function useCreateCourt(venueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCourtPayload) =>
      courtService.create(venueId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerVenueKey(venueId) });
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
    },
  });
}

export function useUpdateCourt(venueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courtId,
      payload,
    }: {
      courtId: string;
      payload: UpdateCourtPayload;
    }) => courtService.update(venueId, courtId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerVenueKey(venueId) });
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
    },
  });
}

export function useDeleteCourt(venueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courtId: string) => courtService.remove(venueId, courtId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerVenueKey(venueId) });
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
    },
  });
}

export function useAmenitiesCatalogue() {
  return useQuery({
    queryKey: AMENITIES_CATALOGUE_KEY,
    queryFn: () => amenityService.listCatalogue(),
    staleTime: 10 * 60_000,
  });
}

export function useReplaceVenueAmenities(venueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amenityIds: string[]) =>
      amenityService.replaceVenueAmenities(venueId, amenityIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerVenueKey(venueId) });
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
    },
  });
}

export function useUploadVenueImage(venueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      onProgress,
      isCover,
    }: {
      file: LocalImageFile;
      onProgress?: (pct: number) => void;
      isCover?: boolean;
    }) => venueImageService.uploadAndRegisterImage(venueId, file, onProgress, isCover),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerVenueKey(venueId) });
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
    },
  });
}

export function useDeleteVenueImage(venueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) =>
      venueImageService.deleteImage(venueId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerVenueKey(venueId) });
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
    },
  });
}

export function useSetCoverVenueImage(venueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) =>
      venueImageService.setCoverImage(venueId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerVenueKey(venueId) });
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
    },
  });
}

export function useReorderVenueImages(venueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageIds: string[]) =>
      venueImageService.reorderImages(venueId, imageIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerVenueKey(venueId) });
      queryClient.invalidateQueries({ queryKey: OWNER_VENUES_KEY });
    },
  });
}
