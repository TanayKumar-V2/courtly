import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { VenueStatus } from '@prisma/client';
import { AmenitiesService } from './amenities.service.js';

describe('AmenitiesService', () => {
  let service: AmenitiesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      venue: { findFirst: jest.fn() },
      amenity: { findMany: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new AmenitiesService(prisma);
  });

  it('validates amenity IDs against the active catalogue and replaces via transaction', async () => {
    prisma.venue.findFirst.mockResolvedValue({
      id: 'venue-1',
      ownerId: 'owner-a',
      status: VenueStatus.DRAFT,
    });
    prisma.amenity.findMany.mockResolvedValue([{ id: 'am-1' }, { id: 'am-2' }]);
    const mockFn = (): any => jest.fn();
    prisma.$transaction.mockImplementation(async (cb: any) =>
      cb({
        venueAmenity: {
          deleteMany: mockFn(),
          createMany: mockFn(),
          findMany: mockFn().mockResolvedValue([
            {
              amenity: {
                id: 'am-1',
                name: 'Parking',
                slug: 'parking',
                category: 'FACILITY',
                icon: 'car',
              },
            },
            {
              amenity: {
                id: 'am-2',
                name: 'Floodlights',
                slug: 'floodlights',
                category: 'FACILITY',
                icon: 'sun',
              },
            },
          ]),
        },
      }),
    );

    const res = await service.replaceVenueAmenities('owner-a', 'venue-1', {
      amenityIds: ['am-1', 'am-2'],
    });
    expect(res.amenities).toHaveLength(2);
  });

  it('rejects unknown/arbitrary amenity IDs', async () => {
    prisma.venue.findFirst.mockResolvedValue({
      id: 'venue-1',
      ownerId: 'owner-a',
      status: VenueStatus.DRAFT,
    });
    prisma.amenity.findMany.mockResolvedValue([{ id: 'am-1' }]);

    await expect(
      service.replaceVenueAmenities('owner-a', 'venue-1', {
        amenityIds: ['am-1', 'arbitrary-unknown-id'],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('enforces venue ownership for amenity updates', async () => {
    prisma.venue.findFirst.mockResolvedValue({
      id: 'venue-1',
      ownerId: 'owner-a',
      status: VenueStatus.DRAFT,
    });

    await expect(
      service.replaceVenueAmenities('owner-b', 'venue-1', {
        amenityIds: ['am-1'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
