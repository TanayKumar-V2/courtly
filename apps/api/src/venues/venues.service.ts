import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { CourtStatus, Prisma, VenueStatus } from '@prisma/client';
import crypto from 'node:crypto';
import { VenuesRepository } from './venues.repository.js';
import { VenueCacheService } from './venue-cache.service.js';
import { CreateVenueDto } from './dto/create-venue.dto.js';
import { UpdateVenueDto } from './dto/update-venue.dto.js';
import {
  QueryPublicVenuesDto,
  VenueSortOption,
} from './dto/query-public-venues.dto.js';
import { QueryVenueMapDto } from './dto/query-venue-map.dto.js';
import { UpdateVenueLocationDto } from './dto/update-venue-location.dto.js';

const MAJOR_PUBLIC_FIELDS = [
  'name',
  'addressLine1',
  'locality',
  'city',
  'state',
  'postalCode',
  'country',
  'latitude',
  'longitude',
  'currency',
] as const;

export interface ListingCompletion {
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

function formatDecimalMoney(value: Prisma.Decimal | number | string): string {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
}

@Injectable()
export class VenuesService {
  private readonly logger = new Logger(VenuesService.name);

  constructor(
    private readonly venuesRepository: VenuesRepository,
    @Optional() private readonly venueCache?: VenueCacheService,
  ) {}

  async createDraftVenue(ownerId: string, dto: CreateVenueDto) {
    this.validateCoordinatePair(dto.latitude, dto.longitude);

    const slug = await this.generateUniqueSlug(dto.name);

    const venue = await this.venuesRepository.create({
      owner: { connect: { id: ownerId } },
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() || '',
      businessContactPhone: dto.businessContactPhone?.trim() || '',
      businessContactEmail: dto.businessContactEmail?.trim().toLowerCase() || '',
      addressLine1: dto.addressLine1?.trim() || '',
      addressLine2: dto.addressLine2?.trim() || null,
      locality: dto.locality?.trim() || '',
      city: dto.city?.trim() || '',
      state: dto.state?.trim() || '',
      postalCode: dto.postalCode?.trim() || '',
      country: dto.country?.trim() || 'India',
      latitude:
        dto.latitude !== undefined ? new Prisma.Decimal(dto.latitude) : null,
      longitude:
        dto.longitude !== undefined ? new Prisma.Decimal(dto.longitude) : null,
      timezone: dto.timezone?.trim() || 'Asia/Kolkata',
      currency: dto.currency ? dto.currency.trim().toUpperCase() : 'INR',
      status: VenueStatus.DRAFT,
    });

    return {
      message: 'Venue draft created successfully',
      venue: this.formatOwnerVenue(venue),
    };
  }

  async listOwnerVenues(ownerId: string, status?: VenueStatus) {
    const allOwnerVenues = await this.venuesRepository.findManyByOwner(ownerId);

    const summary = {
      total: allOwnerVenues.length,
      draft: 0,
      pendingReview: 0,
      approved: 0,
      rejected: 0,
      paused: 0,
    };

    for (const v of allOwnerVenues) {
      if (v.status === VenueStatus.DRAFT) summary.draft++;
      else if (v.status === VenueStatus.PENDING_REVIEW) summary.pendingReview++;
      else if (v.status === VenueStatus.APPROVED) summary.approved++;
      else if (v.status === VenueStatus.REJECTED) summary.rejected++;
      else if (v.status === VenueStatus.PAUSED) summary.paused++;
    }

    const filtered = status
      ? allOwnerVenues.filter((v) => v.status === status)
      : allOwnerVenues;

    return {
      summary,
      venues: filtered.map((v) => this.formatOwnerVenue(v)),
    };
  }

  async getOwnerVenueById(ownerId: string, venueId: string) {
    const venue = await this.venuesRepository.findByIdForOwner(venueId);
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied: you do not own this venue');
    }

    return {
      venue: this.formatOwnerVenue(venue),
    };
  }

  async updateOwnerVenue(
    ownerId: string,
    venueId: string,
    dto: UpdateVenueDto,
  ) {
    const existing = await this.venuesRepository.findByIdForOwner(venueId);
    if (!existing) {
      throw new NotFoundException('Venue not found');
    }

    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied: you do not own this venue');
    }

    if (existing.status === VenueStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'This venue is currently pending admin review and cannot be edited. Withdraw the submission first to make changes.',
      );
    }

    const nextLat =
      dto.latitude !== undefined
        ? dto.latitude
        : existing.latitude !== null
          ? Number(existing.latitude)
          : null;
    const nextLng =
      dto.longitude !== undefined
        ? dto.longitude
        : existing.longitude !== null
          ? Number(existing.longitude)
          : null;

    this.validateCoordinatePair(nextLat, nextLng);

    const updateData: Prisma.VenueUpdateInput = {};

    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined)
      updateData.description = dto.description.trim();
    if (dto.businessContactPhone !== undefined)
      updateData.businessContactPhone = dto.businessContactPhone.trim();
    if (dto.businessContactEmail !== undefined)
      updateData.businessContactEmail = dto.businessContactEmail
        .trim()
        .toLowerCase();
    if (dto.addressLine1 !== undefined)
      updateData.addressLine1 = dto.addressLine1.trim();
    if (dto.addressLine2 !== undefined)
      updateData.addressLine2 = dto.addressLine2 ? dto.addressLine2.trim() : null;
    if (dto.locality !== undefined) updateData.locality = dto.locality.trim();
    if (dto.city !== undefined) updateData.city = dto.city.trim();
    if (dto.state !== undefined) updateData.state = dto.state.trim();
    if (dto.postalCode !== undefined)
      updateData.postalCode = dto.postalCode.trim();
    if (dto.country !== undefined) updateData.country = dto.country.trim();
    if (dto.timezone !== undefined) updateData.timezone = dto.timezone.trim();
    if (dto.currency !== undefined)
      updateData.currency = dto.currency.trim().toUpperCase();
    if (dto.latitude !== undefined) {
      updateData.latitude =
        dto.latitude !== null ? new Prisma.Decimal(dto.latitude) : null;
    }
    if (dto.longitude !== undefined) {
      updateData.longitude =
        dto.longitude !== null ? new Prisma.Decimal(dto.longitude) : null;
    }

    let reReviewTriggered = false;
    if (existing.status === VenueStatus.APPROVED) {
      const hasMajorChange = this.detectMajorPublicChange(existing, dto);
      if (hasMajorChange) {
        updateData.status = VenueStatus.PENDING_REVIEW;
        reReviewTriggered = true;
        this.logger.log(
          `Approved venue ${venueId} had major public-facing changes; moved to PENDING_REVIEW`,
        );
      }
    }

    const updated = await this.venuesRepository.update(venueId, updateData);

    if (existing.status === VenueStatus.APPROVED || updated.status === VenueStatus.APPROVED) {
      await this.venueCache?.invalidateAll();
    }

    return {
      message: reReviewTriggered
        ? 'Venue updated. Because core identity or location details changed, the listing has been moved to Pending Review for administrator verification.'
        : 'Venue updated successfully',
      reReviewTriggered,
      venue: this.formatOwnerVenue(updated),
    };
  }

  async updateOwnerVenueLocation(
    ownerId: string,
    venueId: string,
    dto: UpdateVenueLocationDto,
  ) {
    const existing = await this.venuesRepository.findByIdForOwner(venueId);
    if (!existing) {
      throw new NotFoundException('Venue not found');
    }

    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied: you do not own this venue');
    }

    if (existing.status === VenueStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Cannot change venue coordinates while pending review. Withdraw submission first.',
      );
    }

    this.validateCoordinatePair(dto.latitude, dto.longitude);

    const updated = await this.venuesRepository.update(venueId, {
      latitude: new Prisma.Decimal(dto.latitude.toFixed(6)),
      longitude: new Prisma.Decimal(dto.longitude.toFixed(6)),
    });

    if (existing.status === VenueStatus.APPROVED) {
      await this.venueCache?.invalidateAll();
    }

    return {
      message: 'Venue coordinates saved successfully',
      venue: this.formatOwnerVenue(updated),
    };
  }

  async deleteOrArchiveOwnerVenue(ownerId: string, venueId: string) {
    const existing = await this.venuesRepository.findByIdForOwner(venueId);
    if (!existing) {
      throw new NotFoundException('Venue not found');
    }

    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied: you do not own this venue');
    }

    if (
      existing.status === VenueStatus.DRAFT &&
      !existing.publishedAt &&
      !existing.reviewedAt
    ) {
      await this.venuesRepository.deleteHard(venueId);
      return {
        message: 'Draft venue permanently deleted',
        archived: false,
      };
    }

    await this.venuesRepository.archiveSoft(venueId);
    await this.venueCache?.invalidateAll();

    return {
      message: 'Venue safely archived and removed from public visibility',
      archived: true,
    };
  }

  async submitVenueForReview(ownerId: string, venueId: string) {
    const existing = await this.venuesRepository.findByIdForOwner(venueId);
    if (!existing) {
      throw new NotFoundException('Venue not found');
    }

    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied: you do not own this venue');
    }

    if (existing.status === VenueStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'This venue is already submitted and pending administrator review',
      );
    }

    if (existing.status === VenueStatus.APPROVED) {
      throw new BadRequestException('This venue is already approved and live');
    }

    if (existing.status === VenueStatus.PAUSED) {
      throw new BadRequestException(
        'Paused venues cannot be resubmitted directly. Please contact Courtly support.',
      );
    }

    const completion = this.computeListingCompletion(existing);
    if (!completion.isReadyToSubmit) {
      throw new BadRequestException(
        `Venue listing is incomplete and cannot be submitted for review. Missing: ${completion.missingRequirements.join(', ')}`,
      );
    }

    const updated = await this.venuesRepository.update(venueId, {
      status: VenueStatus.PENDING_REVIEW,
      rejectionReason: null,
    });

    this.logger.log(
      `[ADMIN NOTIFICATION] Venue "${updated.name}" (${updated.id}) submitted for review by owner ${ownerId}`,
    );

    return {
      message:
        'Venue submitted for administrator review. It will become publicly visible once approved.',
      venue: this.formatOwnerVenue(updated),
    };
  }

  async withdrawVenueSubmission(ownerId: string, venueId: string) {
    const existing = await this.venuesRepository.findByIdForOwner(venueId);
    if (!existing) {
      throw new NotFoundException('Venue not found');
    }

    if (existing.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied: you do not own this venue');
    }

    if (existing.status !== VenueStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Only venues currently in PENDING_REVIEW status can be withdrawn back to draft',
      );
    }

    const updated = await this.venuesRepository.update(venueId, {
      status: VenueStatus.DRAFT,
    });

    return {
      message: 'Submission withdrawn. Venue returned to draft for editing.',
      venue: this.formatOwnerVenue(updated),
    };
  }

  // =========================================================
  // PUBLIC DISCOVERY SEARCH, MAP & DETAILS
  // =========================================================

  async listPublicApprovedVenues(query: QueryPublicVenuesDto) {
    const searchText = (query.q ?? query.search)?.trim() || undefined;
    const city = query.city?.trim() || undefined;
    const state = query.state?.trim() || undefined;
    const page = query.page || 1;
    const pageSize = query.pageSize ?? query.limit ?? 20;

    if (searchText && searchText.length > 100) {
      throw new BadRequestException('Search text cannot exceed 100 characters');
    }

    if (query.minPrice !== undefined && query.minPrice < 0) {
      throw new BadRequestException('minPrice cannot be negative');
    }
    if (query.maxPrice !== undefined && query.maxPrice < 0) {
      throw new BadRequestException('maxPrice cannot be negative');
    }
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    this.validateCoordinatePair(query.latitude, query.longitude);

    const hasCoords =
      query.latitude !== undefined && query.longitude !== undefined;

    if (query.radiusKm !== undefined) {
      if (query.radiusKm <= 0 || query.radiusKm > 50) {
        throw new BadRequestException('radiusKm must be between 0.1 and 50 km');
      }
      if (!hasCoords) {
        throw new BadRequestException(
          'latitude and longitude are required when radiusKm is specified',
        );
      }
    }

    const sort =
      query.sort ??
      (hasCoords ? VenueSortOption.DISTANCE : VenueSortOption.NEWEST);

    if (sort === VenueSortOption.DISTANCE && !hasCoords) {
      throw new BadRequestException(
        'DISTANCE sorting requires valid latitude and longitude coordinates',
      );
    }

    const rawAmenities = query.amenityIds ?? query.amenities;
    const amenityIds = rawAmenities
      ? Array.from(
          new Set(
            rawAmenities
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        )
      : undefined;

    const normalizedFilters = {
      page,
      pageSize,
      q: searchText,
      city,
      state,
      sport: query.sport,
      amenityIds,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      indoor: query.indoor,
      latitude: query.latitude,
      longitude: query.longitude,
      radiusKm: hasCoords ? (query.radiusKm ?? 10) : undefined,
      sort,
    };

    const cached = await this.venueCache?.get<any>('search', normalizedFilters);
    if (cached) {
      return cached;
    }

    const { items, total, distanceById } =
      await this.venuesRepository.searchPublicApprovedVenues(normalizedFilters);

    const totalPages = Math.ceil(total / pageSize) || 1;
    const response = {
      data: items.map((v) =>
        this.formatPublicSearchItem(v, distanceById.get(v.id) ?? null),
      ),
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
      // Backward-compatible pagination key alongside `meta`
      pagination: {
        page,
        limit: pageSize,
        total,
        totalPages,
      },
    };

    await this.venueCache?.set('search', normalizedFilters, response, 60);
    return response;
  }

  async getPublicMapMarkers(query: QueryVenueMapDto) {
    if (query.north < query.south) {
      throw new BadRequestException(
        'Map bounding box invalid: north must be greater than or equal to south',
      );
    }

    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const amenityIds = query.amenityIds
      ? Array.from(
          new Set(
            query.amenityIds
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        )
      : undefined;

    const normalized = {
      north: Number(query.north.toFixed(5)),
      south: Number(query.south.toFixed(5)),
      east: Number(query.east.toFixed(5)),
      west: Number(query.west.toFixed(5)),
      q: query.q?.trim() || undefined,
      city: query.city?.trim() || undefined,
      state: query.state?.trim() || undefined,
      sport: query.sport,
      amenityIds,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      indoor: query.indoor,
    };

    const cached = await this.venueCache?.get<any>('map', normalized);
    if (cached) {
      return cached;
    }

    const { items, hasMore } =
      await this.venuesRepository.findPublicMapMarkers(normalized);

    const markers = items
      .filter((v) => v.latitude !== null && v.longitude !== null)
      .map((v) => {
        const sports = Array.from(new Set(v.courts.map((c) => c.sport)));
        const startingPricePerHour =
          v.courts.length > 0
            ? formatDecimalMoney(v.courts[0].basePricePerHour)
            : null;
        return {
          id: v.id,
          slug: v.slug,
          name: v.name,
          locality: v.locality,
          city: v.city,
          state: v.state,
          latitude: Number(v.latitude),
          longitude: Number(v.longitude),
          sports,
          activeCourtCount: v.courts.length,
          startingPricePerHour,
          currency: v.currency,
          coverImage: v.images[0] ? { secureUrl: v.images[0].secureUrl } : null,
        };
      });

    const response = {
      markers,
      count: markers.length,
      hasMore,
    };

    await this.venueCache?.set('map', normalized, response, 60);
    return response;
  }

  async getPublicApprovedVenueById(venueId: string) {
    const cacheParams = { venueId };
    const cached = await this.venueCache?.get<any>('detail', cacheParams);
    if (cached) {
      return cached;
    }

    const venue = await this.venuesRepository.findPublicApprovedById(venueId);
    if (!venue) {
      throw new NotFoundException('Approved venue not found');
    }

    const response = {
      venue: this.formatPublicVenueDetail(venue),
    };

    await this.venueCache?.set('detail', cacheParams, response, 60);
    return response;
  }

  async getPublicApprovedVenueCourts(venueId: string) {
    const cacheParams = { venueId };
    const cached = await this.venueCache?.get<any>('courts', cacheParams);
    if (cached) {
      return cached;
    }

    const result =
      await this.venuesRepository.findPublicApprovedCourts(venueId);
    if (!result) {
      throw new NotFoundException('Approved venue not found');
    }

    const response = {
      venueId: result.venue.id,
      venueName: result.venue.name,
      currency: result.venue.currency,
      courts: result.courts.map((c) => this.formatCourt(c)),
    };

    await this.venueCache?.set('courts', cacheParams, response, 60);
    return response;
  }

  computeListingCompletion(venue: any): ListingCompletion {
    const hasName = Boolean(venue.name?.trim());
    const hasDescription = Boolean(venue.description?.trim());
    const hasBasicInfo = hasName && hasDescription;

    const hasContactInfo = Boolean(
      venue.businessContactPhone?.trim() && venue.businessContactEmail?.trim(),
    );

    const hasCompleteAddress = Boolean(
      venue.addressLine1?.trim() &&
        venue.locality?.trim() &&
        venue.city?.trim() &&
        venue.state?.trim() &&
        venue.postalCode?.trim() &&
        venue.country?.trim(),
    );

    const activeCourts = (venue.courts || []).filter(
      (c: any) => c.status === CourtStatus.ACTIVE,
    );
    const hasActiveCourt = activeCourts.length > 0;
    const hasImage = (venue.images || []).length > 0;
    const hasAmenity = (venue.amenities || []).length > 0;

    const missingRequirements: string[] = [];
    if (!hasName) missingRequirements.push('Venue name');
    if (!hasDescription) missingRequirements.push('Venue description');
    if (!hasContactInfo) missingRequirements.push('Contact phone and email');
    if (!hasCompleteAddress)
      missingRequirements.push(
        'Complete address (address line 1, locality, city, state, postal code, country)',
      );
    if (!hasActiveCourt) missingRequirements.push('At least one active court');
    if (!hasImage) missingRequirements.push('At least one venue photograph');
    if (!hasAmenity) missingRequirements.push('At least one selected amenity');

    const checks = [
      hasBasicInfo,
      hasContactInfo,
      hasCompleteAddress,
      hasActiveCourt,
      hasImage,
      hasAmenity,
    ];
    const completedCount = checks.filter(Boolean).length;
    const completionPercent = Math.round((completedCount / checks.length) * 100);

    return {
      isReadyToSubmit: missingRequirements.length === 0,
      completionPercent,
      missingRequirements,
      checklist: {
        hasBasicInfo,
        hasContactInfo,
        hasCompleteAddress,
        hasActiveCourt,
        hasImage,
        hasAmenity,
      },
    };
  }

  formatOwnerVenue(venue: any) {
    const courts = (venue.courts || []).map((c: any) => this.formatCourt(c));
    const amenities = (venue.amenities || []).map((va: any) => ({
      id: va.amenity.id,
      name: va.amenity.name,
      slug: va.amenity.slug,
      category: va.amenity.category,
      icon: va.amenity.icon,
    }));
    const images = (venue.images || []).map((img: any) => ({
      id: img.id,
      publicId: img.publicId,
      secureUrl: img.secureUrl,
      width: img.width,
      height: img.height,
      format: img.format,
      bytes: img.bytes,
      position: img.position,
      isCover: img.isCover,
      createdAt: img.createdAt,
    }));

    const coverImage = images.find((i: any) => i.isCover) || images[0] || null;
    const sports = Array.from(
      new Set(
        courts
          .filter((c: any) => c.status === CourtStatus.ACTIVE)
          .map((c: any) => c.sport),
      ),
    );
    const activePrices = courts
      .filter((c: any) => c.status === CourtStatus.ACTIVE)
      .map((c: any) => Number(c.basePricePerHour));
    const startingPricePerHour =
      activePrices.length > 0 ? Math.min(...activePrices) : null;

    return {
      id: venue.id,
      ownerId: venue.ownerId,
      name: venue.name,
      slug: venue.slug,
      description: venue.description,
      businessContactPhone: venue.businessContactPhone,
      businessContactEmail: venue.businessContactEmail,
      addressLine1: venue.addressLine1,
      addressLine2: venue.addressLine2,
      locality: venue.locality,
      city: venue.city,
      state: venue.state,
      postalCode: venue.postalCode,
      country: venue.country,
      latitude: venue.latitude !== null ? Number(venue.latitude) : null,
      longitude: venue.longitude !== null ? Number(venue.longitude) : null,
      timezone: venue.timezone,
      currency: venue.currency,
      status: venue.status,
      rejectionReason: venue.rejectionReason,
      reviewedAt: venue.reviewedAt,
      publishedAt: venue.publishedAt,
      createdAt: venue.createdAt,
      updatedAt: venue.updatedAt,
      sports,
      courtCount: courts.length,
      activeCourtCount: courts.filter((c: any) => c.status === CourtStatus.ACTIVE)
        .length,
      startingPricePerHour,
      coverImage,
      images,
      courts,
      amenities,
      completion: this.computeListingCompletion(venue),
    };
  }

  formatPublicSearchItem(venue: any, distanceKm: number | null) {
    const activeCourts = (venue.courts || []).filter(
      (c: any) => c.status === CourtStatus.ACTIVE,
    );
    const amenities = (venue.amenities || []).map((va: any) => ({
      id: va.amenity.id,
      name: va.amenity.name,
      slug: va.amenity.slug,
      category: va.amenity.category,
      icon: va.amenity.icon,
    }));
    const images = (venue.images || []).map((img: any) => ({
      id: img.id,
      secureUrl: img.secureUrl,
      width: img.width,
      height: img.height,
      position: img.position,
      isCover: img.isCover,
    }));

    const coverImage = images.find((i: any) => i.isCover) || images[0] || null;
    const sports = Array.from(new Set(activeCourts.map((c: any) => c.sport)));
    const prices = activeCourts.map((c: any) => Number(c.basePricePerHour));
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;

    return {
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      description: venue.description,
      locality: venue.locality,
      city: venue.city,
      state: venue.state,
      country: venue.country,
      latitude: venue.latitude !== null ? Number(venue.latitude) : null,
      longitude: venue.longitude !== null ? Number(venue.longitude) : null,
      sports,
      coverImage: coverImage ? { secureUrl: coverImage.secureUrl } : null,
      startingPricePerHour:
        minPrice !== null ? formatDecimalMoney(minPrice) : null,
      currency: venue.currency,
      activeCourtCount: activeCourts.length,
      amenities,
      distanceKm,
      // Retain nested address for backward compatibility with Phase 3 consumers
      address: {
        addressLine1: venue.addressLine1,
        addressLine2: venue.addressLine2,
        locality: venue.locality,
        city: venue.city,
        state: venue.state,
        postalCode: venue.postalCode,
        country: venue.country,
      },
      courts: activeCourts.map((c: any) => this.formatCourt(c)),
    };
  }

  formatPublicVenueDetail(venue: any) {
    const activeCourts = (venue.courts || [])
      .filter((c: any) => c.status === CourtStatus.ACTIVE)
      .map((c: any) => this.formatCourt(c));
    const amenities = (venue.amenities || []).map((va: any) => ({
      id: va.amenity.id,
      name: va.amenity.name,
      slug: va.amenity.slug,
      category: va.amenity.category,
      icon: va.amenity.icon,
    }));
    const images = (venue.images || []).map((img: any) => ({
      id: img.id,
      secureUrl: img.secureUrl,
      width: img.width,
      height: img.height,
      position: img.position,
      isCover: img.isCover,
    }));

    const coverImage = images.find((i: any) => i.isCover) || images[0] || null;
    const sports = Array.from(new Set(activeCourts.map((c: any) => c.sport)));
    const prices = activeCourts.map((c: any) => Number(c.basePricePerHour));
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;

    const formattedAddress = [
      venue.addressLine1,
      venue.addressLine2,
      venue.locality,
      venue.city,
      venue.state,
      venue.postalCode,
      venue.country,
    ]
      .filter(Boolean)
      .join(', ');

    // Strictly omit private owner user email, application details, rejectionReason, reviewedById, ownerId
    return {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      description: venue.description,
      contact: {
        phone: venue.businessContactPhone,
        email: venue.businessContactEmail,
      },
      address: {
        addressLine1: venue.addressLine1,
        addressLine2: venue.addressLine2,
        locality: venue.locality,
        city: venue.city,
        state: venue.state,
        postalCode: venue.postalCode,
        country: venue.country,
        formatted: formattedAddress,
      },
      location: {
        latitude: venue.latitude !== null ? Number(venue.latitude) : null,
        longitude: venue.longitude !== null ? Number(venue.longitude) : null,
      },
      timezone: venue.timezone,
      currency: venue.currency,
      publishedAt: venue.publishedAt,
      sports,
      activeCourtCount: activeCourts.length,
      startingPricePerHour:
        minPrice !== null ? formatDecimalMoney(minPrice) : null,
      coverImage,
      images,
      courts: activeCourts,
      amenities,
    };
  }

  private formatCourt(court: any) {
    return {
      id: court.id,
      venueId: court.venueId,
      name: court.name,
      sport: court.sport,
      description: court.description,
      surfaceType: court.surfaceType,
      indoor: court.indoor,
      maxPlayers: court.maxPlayers,
      basePricePerHour: Number(court.basePricePerHour),
      hourlyPriceFormatted: formatDecimalMoney(court.basePricePerHour),
      currency: court.currency,
      status: court.status,
      createdAt: court.createdAt,
      updatedAt: court.updatedAt,
    };
  }

  private validateCoordinatePair(
    latitude?: number | null,
    longitude?: number | null,
  ) {
    const hasLat = latitude !== undefined && latitude !== null;
    const hasLng = longitude !== undefined && longitude !== null;

    if (hasLat !== hasLng) {
      throw new BadRequestException(
        'Both latitude and longitude must be provided together',
      );
    }

    if (hasLat && (latitude! < -90 || latitude! > 90)) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }

    if (hasLng && (longitude! < -180 || longitude! > 180)) {
      throw new BadRequestException('Longitude must be between -180 and 180');
    }
  }

  private detectMajorPublicChange(existing: any, dto: UpdateVenueDto): boolean {
    for (const field of MAJOR_PUBLIC_FIELDS) {
      if (dto[field] === undefined) continue;

      if (field === 'latitude' || field === 'longitude') {
        const oldVal =
          existing[field] !== null ? Number(existing[field]) : null;
        const newVal = dto[field] !== null ? Number(dto[field]) : null;
        if (oldVal !== newVal) return true;
      } else {
        const oldVal = String(existing[field] ?? '').trim();
        const newVal = String(dto[field] ?? '').trim();
        if (oldVal !== newVal) return true;
      }
    }
    return false;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'venue';

    let candidate = base;
    const existing = await this.venuesRepository.findBySlug(candidate);
    if (!existing) {
      return candidate;
    }

    for (let i = 0; i < 5; i++) {
      const suffix = crypto.randomBytes(3).toString('hex');
      candidate = `${base}-${suffix}`;
      const taken = await this.venuesRepository.findBySlug(candidate);
      if (!taken) return candidate;
    }

    return `${base}-${Date.now()}`;
  }
}
