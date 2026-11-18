import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { OwnerApplicationStatus, Role, UserStatus } from '@prisma/client';
import { OwnerApplicationsService } from './owner-applications.service.js';

describe('OwnerApplicationsService', () => {
  let service: OwnerApplicationsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      ownerApplication: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };
    service = new OwnerApplicationsService(prisma);
  });

  const validDto = {
    businessName: 'Apex Turf Arena',
    businessType: 'Sports Complex',
    contactPerson: 'Rohan Sharma',
    contactPhone: '+919876543210',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    additionalInformation: '3 FIFA-certified 5v5 turfs',
  };

  it('creates an owner application for an email-verified PLAYER', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      roles: [{ role: Role.PLAYER }],
    });
    prisma.ownerApplication.findFirst.mockResolvedValue(null);
    prisma.ownerApplication.create.mockResolvedValue({
      id: 'app-1',
      userId: 'user-1',
      ...validDto,
      status: OwnerApplicationStatus.PENDING,
      reviewedAt: null,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.submitApplication('user-1', validDto);

    expect(result.application.status).toBe(OwnerApplicationStatus.PENDING);
    expect(result.application.businessName).toBe('Apex Turf Arena');
    expect(prisma.ownerApplication.create).toHaveBeenCalledTimes(1);
  });

  it('rejects unverified users from submitting an owner application', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-unverified',
      status: UserStatus.PENDING_VERIFICATION,
      emailVerifiedAt: null,
      roles: [{ role: Role.PLAYER }],
    });

    await expect(
      service.submitApplication('user-unverified', validDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('prevents duplicate pending owner applications for the same user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      roles: [{ role: Role.PLAYER }],
    });
    prisma.ownerApplication.findFirst.mockResolvedValueOnce({
      id: 'existing-pending',
      status: OwnerApplicationStatus.PENDING,
    });

    await expect(service.submitApplication('user-1', validDto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('blocks users who already have VENUE_OWNER role from re-applying', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'owner-1',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      roles: [{ role: Role.PLAYER }, { role: Role.VENUE_OWNER }],
    });

    await expect(service.submitApplication('owner-1', validDto)).rejects.toThrow(
      ConflictException,
    );
  });
});
