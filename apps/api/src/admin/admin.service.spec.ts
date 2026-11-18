import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CourtStatus,
  OwnerApplicationStatus,
  Role,
  Sport,
  UserStatus,
  VenueStatus,
} from '@prisma/client';
import { AdminService } from './admin.service.js';
import { VenuesService } from '../venues/venues.service.js';

const mockFn = (): any => jest.fn();

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;
  let venuesService: VenuesService;

  beforeEach(() => {
    prisma = {
      $transaction: mockFn(),
    };
    venuesService = new VenuesService({} as any);
    service = new AdminService(prisma, venuesService);
  });

  it('approves a pending owner application, grants VENUE_OWNER role, and records audit log', async () => {
    const upsertRole = mockFn().mockResolvedValue({});
    const createAudit = mockFn().mockResolvedValue({});

    prisma.$transaction.mockImplementation(async (cb: any) =>
      cb({
        ownerApplication: {
          findUnique: mockFn()
            .mockResolvedValueOnce({
              id: 'app-1',
              userId: 'player-1',
              businessName: 'Victory Arena',
              status: OwnerApplicationStatus.PENDING,
              user: {
                id: 'player-1',
                status: UserStatus.ACTIVE,
                emailVerifiedAt: new Date(),
              },
            })
            .mockResolvedValueOnce({
              id: 'app-1',
              userId: 'player-1',
              status: OwnerApplicationStatus.APPROVED,
            }),
          updateMany: mockFn().mockResolvedValue({ count: 1 }),
        },
        userRole: { upsert: upsertRole },
        adminAuditLog: { create: createAudit },
      }),
    );

    const res = await service.approveOwnerApplication('admin-1', 'app-1');

    expect(res.application?.status).toBe(OwnerApplicationStatus.APPROVED);
    expect(upsertRole).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { userId: 'player-1', role: Role.VENUE_OWNER },
      }),
    );
    expect(createAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'admin-1',
          entityType: 'OWNER_APPLICATION',
          action: 'APPROVE',
        }),
      }),
    );
  });

  it('prevents an admin from approving their own owner application', async () => {
    prisma.$transaction.mockImplementation(async (cb: any) =>
      cb({
        ownerApplication: {
          findUnique: mockFn().mockResolvedValue({
            id: 'app-self',
            userId: 'admin-1',
            status: OwnerApplicationStatus.PENDING,
            user: {
              id: 'admin-1',
              status: UserStatus.ACTIVE,
              emailVerifiedAt: new Date(),
            },
          }),
        },
      }),
    );

    await expect(
      service.approveOwnerApplication('admin-1', 'app-self'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects an owner application with a required reason without granting VENUE_OWNER', async () => {
    await expect(
      service.rejectOwnerApplication('admin-1', 'app-1', '   '),
    ).rejects.toThrow(BadRequestException);

    const createAudit = mockFn().mockResolvedValue({});
    prisma.$transaction.mockImplementation(async (cb: any) =>
      cb({
        ownerApplication: {
          findUnique: mockFn()
            .mockResolvedValueOnce({
              id: 'app-1',
              userId: 'player-1',
              businessName: 'Test Turf',
              status: OwnerApplicationStatus.PENDING,
            })
            .mockResolvedValueOnce({
              id: 'app-1',
              status: OwnerApplicationStatus.REJECTED,
              rejectionReason: 'Incomplete phone verification',
            }),
          updateMany: mockFn().mockResolvedValue({ count: 1 }),
        },
        adminAuditLog: { create: createAudit },
      }),
    );

    const res = await service.rejectOwnerApplication(
      'admin-1',
      'app-1',
      'Incomplete phone verification',
    );
    expect(res.application?.status).toBe(OwnerApplicationStatus.REJECTED);
    expect(createAudit).toHaveBeenCalledTimes(1);
  });

  it('approves a PENDING_REVIEW venue and blocks owner self-approval', async () => {
    const completeVenue = {
      id: 'venue-1',
      ownerId: 'owner-1',
      name: 'Skyline Courts',
      slug: 'skyline-courts',
      description: 'Top notch indoor courts',
      businessContactPhone: '+919876543210',
      businessContactEmail: 'hi@skyline.in',
      addressLine1: '100 Feet Road',
      addressLine2: null,
      locality: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560034',
      country: 'India',
      latitude: null,
      longitude: null,
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      status: VenueStatus.PENDING_REVIEW,
      courts: [
        {
          id: 'c1',
          status: CourtStatus.ACTIVE,
          sport: Sport.PADEL,
          basePricePerHour: 1200,
          currency: 'INR',
        },
      ],
      images: [{ id: 'i1', isCover: true, position: 0 }],
      amenities: [
        {
          amenity: {
            id: 'a1',
            name: 'Parking',
            slug: 'parking',
            category: 'FACILITY',
            icon: 'car',
          },
        },
      ],
    };

    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb({
        venue: { findFirst: mockFn().mockResolvedValue(completeVenue) },
      }),
    );
    await expect(service.approveVenue('owner-1', 'venue-1')).rejects.toThrow(
      ForbiddenException,
    );

    const createAudit = mockFn().mockResolvedValue({});
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb({
        venue: {
          findFirst: mockFn().mockResolvedValue(completeVenue),
          update: mockFn().mockResolvedValue({
            ...completeVenue,
            status: VenueStatus.APPROVED,
            publishedAt: new Date(),
          }),
        },
        adminAuditLog: { create: createAudit },
      }),
    );

    const res = await service.approveVenue('admin-1', 'venue-1');
    expect(res.venue.status).toBe(VenueStatus.APPROVED);
    expect(createAudit).toHaveBeenCalledTimes(1);
  });

  it('rejects venue approval if venue is still DRAFT', async () => {
    prisma.$transaction.mockImplementation(async (cb: any) =>
      cb({
        venue: {
          findFirst: mockFn().mockResolvedValue({
            id: 'venue-draft',
            ownerId: 'owner-1',
            status: VenueStatus.DRAFT,
          }),
        },
      }),
    );

    await expect(
      service.approveVenue('admin-1', 'venue-draft'),
    ).rejects.toThrow(ConflictException);
  });
});
