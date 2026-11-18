import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CourtStatus, Sport, VenueStatus } from '@prisma/client';
import { VenuesService } from './venues.service.js';

describe('VenuesService', () => {
  let service: VenuesService;
  let repo: any;

  const baseVenue = {
    id: 'venue-1',
    ownerId: 'owner-a',
    name: 'Emerald Sports Hub',
    slug: 'emerald-sports-hub',
    description: 'Premier turf and badminton arena',
    businessContactPhone: '+919900112233',
    businessContactEmail: 'contact@emerald.in',
    addressLine1: '12 MG Road',
    addressLine2: null,
    locality: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India',
    latitude: 12.971599,
    longitude: 77.594563,
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    status: VenueStatus.DRAFT,
    rejectionReason: null,
    reviewedAt: null,
    publishedAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    courts: [
      {
        id: 'court-1',
        venueId: 'venue-1',
        name: 'Turf A',
        sport: Sport.FOOTBALL,
        description: null,
        surfaceType: 'Artificial Turf',
        indoor: false,
        maxPlayers: 10,
        basePricePerHour: 1500,
        currency: 'INR',
        status: CourtStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    amenities: [
      {
        amenity: {
          id: 'am-1',
          name: 'Parking',
          slug: 'parking',
          category: 'FACILITY',
          icon: 'car',
        },
      },
    ],
    images: [
      {
        id: 'img-1',
        publicId: 'courtly/venues/owner-a/venue-1/img_1',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/img_1.jpg',
        width: 1200,
        height: 800,
        format: 'jpg',
        bytes: 204800,
        position: 0,
        isCover: true,
        createdAt: new Date(),
      },
    ],
  };

  beforeEach(() => {
    repo = {
      findBySlug: jest.fn(),
      create: jest.fn(),
      findManyByOwner: jest.fn(),
      findByIdForOwner: jest.fn(),
      update: jest.fn(),
      deleteHard: jest.fn(),
      archiveSoft: jest.fn(),
      findPublicApprovedVenues: jest.fn(),
      findPublicApprovedById: jest.fn(),
      findPublicApprovedCourts: jest.fn(),
    };
    service = new VenuesService(repo);
  });

  it('creates a venue in DRAFT status with default INR currency', async () => {
    repo.findBySlug.mockResolvedValue(null);
    repo.create.mockResolvedValue(baseVenue);

    const res = await service.createDraftVenue('owner-a', {
      name: 'Emerald Sports Hub',
      city: 'Bengaluru',
    });

    expect(res.venue.status).toBe(VenueStatus.DRAFT);
    expect(res.venue.currency).toBe('INR');
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid coordinate pairs on creation', async () => {
    await expect(
      service.createDraftVenue('owner-a', {
        name: 'Invalid Coords Arena',
        latitude: 12.97,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createDraftVenue('owner-a', {
        name: 'Out of range Coords',
        latitude: 95,
        longitude: 77,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('enforces venue ownership: Owner B cannot read or update Owner A venue', async () => {
    repo.findByIdForOwner.mockResolvedValue(baseVenue);

    await expect(service.getOwnerVenueById('owner-b', 'venue-1')).rejects.toThrow(
      ForbiddenException,
    );
    await expect(
      service.updateOwnerVenue('owner-b', 'venue-1', { name: 'Hijacked' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('triggers re-review only on major public field updates for APPROVED venues', async () => {
    const approvedVenue = { ...baseVenue, status: VenueStatus.APPROVED };
    repo.findByIdForOwner.mockResolvedValue(approvedVenue);
    repo.update.mockImplementation(async (_id: string, data: any) => ({
      ...approvedVenue,
      ...data,
    }));

    // Harmless description edit keeps APPROVED status
    const harmlessRes = await service.updateOwnerVenue('owner-a', 'venue-1', {
      description: 'Updated description text',
    });
    expect(harmlessRes.reReviewTriggered).toBe(false);
    expect(harmlessRes.venue.status).toBe(VenueStatus.APPROVED);

    // Major location/name edit transitions back to PENDING_REVIEW
    const majorRes = await service.updateOwnerVenue('owner-a', 'venue-1', {
      name: 'Renamed Arena',
    });
    expect(majorRes.reReviewTriggered).toBe(true);
    expect(majorRes.venue.status).toBe(VenueStatus.PENDING_REVIEW);
  });

  it('prevents submission if required courts, images, or amenities are missing', async () => {
    repo.findByIdForOwner.mockResolvedValue({
      ...baseVenue,
      courts: [],
      images: [],
      amenities: [],
    });

    await expect(
      service.submitVenueForReview('owner-a', 'venue-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('submits a complete venue for review -> PENDING_REVIEW', async () => {
    repo.findByIdForOwner.mockResolvedValue(baseVenue);
    repo.update.mockResolvedValue({
      ...baseVenue,
      status: VenueStatus.PENDING_REVIEW,
    });

    const res = await service.submitVenueForReview('owner-a', 'venue-1');
    expect(res.venue.status).toBe(VenueStatus.PENDING_REVIEW);
  });

  it('archives approved/published venues instead of hard-deleting them', async () => {
    repo.findByIdForOwner.mockResolvedValue({
      ...baseVenue,
      status: VenueStatus.APPROVED,
      publishedAt: new Date(),
    });
    repo.archiveSoft.mockResolvedValue({});

    const res = await service.deleteOrArchiveOwnerVenue('owner-a', 'venue-1');
    expect(res.archived).toBe(true);
    expect(repo.archiveSoft).toHaveBeenCalledWith('venue-1');
    expect(repo.deleteHard).not.toHaveBeenCalled();
  });

  it('returns only approved venues on public queries and omits internal admin fields', async () => {
    repo.findPublicApprovedById.mockResolvedValue(null);
    await expect(service.getPublicApprovedVenueById('draft-id')).rejects.toThrow(
      NotFoundException,
    );

    repo.findPublicApprovedById.mockResolvedValue({
      ...baseVenue,
      status: VenueStatus.APPROVED,
      rejectionReason: 'Internal secret note',
    });

    const publicRes = await service.getPublicApprovedVenueById('venue-1');
    expect(publicRes.venue.name).toBe('Emerald Sports Hub');
    expect((publicRes.venue as any).rejectionReason).toBeUndefined();
    expect((publicRes.venue as any).ownerId).toBeUndefined();
  });
});
