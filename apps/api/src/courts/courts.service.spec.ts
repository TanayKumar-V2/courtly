import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CourtStatus, Sport, VenueStatus } from '@prisma/client';
import { CourtsService } from './courts.service.js';

describe('CourtsService', () => {
  let service: CourtsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      venue: {
        findFirst: jest.fn(),
      },
      court: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new CourtsService(prisma);
  });

  it('creates a valid court with Decimal hourly price', async () => {
    prisma.venue.findFirst.mockResolvedValue({
      id: 'venue-1',
      ownerId: 'owner-a',
      currency: 'INR',
      status: VenueStatus.DRAFT,
    });
    prisma.court.create.mockResolvedValue({
      id: 'court-1',
      venueId: 'venue-1',
      name: 'Court 1',
      sport: Sport.BADMINTON,
      description: 'Wooden floor',
      surfaceType: 'Hardwood',
      indoor: true,
      maxPlayers: 4,
      basePricePerHour: '650.00',
      currency: 'INR',
      status: CourtStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await service.createCourt('owner-a', 'venue-1', {
      name: 'Court 1',
      sport: Sport.BADMINTON,
      indoor: true,
      maxPlayers: 4,
      basePricePerHour: 650,
    });

    expect(res.court.basePricePerHour).toBe(650);
    expect(res.court.currency).toBe('INR');
  });

  it('rejects non-positive hourly price or currency mismatch', async () => {
    prisma.venue.findFirst.mockResolvedValue({
      id: 'venue-1',
      ownerId: 'owner-a',
      currency: 'INR',
      status: VenueStatus.DRAFT,
    });

    await expect(
      service.createCourt('owner-a', 'venue-1', {
        name: 'Bad Price Court',
        sport: Sport.FOOTBALL,
        maxPlayers: 10,
        basePricePerHour: 0,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createCourt('owner-a', 'venue-1', {
        name: 'Wrong Currency Court',
        sport: Sport.FOOTBALL,
        maxPlayers: 10,
        basePricePerHour: 1000,
        currency: 'USD',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('blocks non-owner from creating or modifying courts', async () => {
    prisma.venue.findFirst.mockResolvedValue({
      id: 'venue-1',
      ownerId: 'owner-a',
      currency: 'INR',
      status: VenueStatus.DRAFT,
    });

    await expect(
      service.createCourt('owner-b', 'venue-1', {
        name: 'Unauthorized Court',
        sport: Sport.TENNIS,
        maxPlayers: 4,
        basePricePerHour: 800,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
