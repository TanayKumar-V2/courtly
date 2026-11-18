import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { VenueStatus } from '@prisma/client';
import { VenueImagesService } from './venue-images.service.js';

describe('VenueImagesService', () => {
  let service: VenueImagesService;
  let prisma: any;
  let cloudinaryService: any;

  beforeEach(() => {
    prisma = {
      venue: { findFirst: jest.fn() },
      venueImage: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    cloudinaryService = {
      generateSignedUploadParams: jest.fn(),
      verifyUploadedAsset: jest.fn(),
      deleteAsset: jest.fn(),
    };
    service = new VenueImagesService(prisma, cloudinaryService);
  });

  it('generates signed upload params for the venue owner when under the 10-image limit', async () => {
    prisma.venue.findFirst.mockResolvedValue({
      id: 'venue-1',
      ownerId: 'owner-a',
      status: VenueStatus.DRAFT,
    });
    prisma.venueImage.count.mockResolvedValue(2);
    cloudinaryService.generateSignedUploadParams.mockReturnValue({
      cloudName: 'demo',
      apiKey: 'key',
      timestamp: 1700000000,
      signature: 'sig123',
      folder: 'courtly/venues/owner-a/venue-1',
      publicId: 'img_abc',
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      maxFileSizeBytes: 8388608,
      uploadUrl: 'https://api.cloudinary.com/v1_1/demo/image/upload',
    });

    const res = await service.generateUploadSignature('owner-a', 'venue-1');
    expect(res.signature).toBe('sig123');
    expect(res.remainingSlots).toBe(8);
  });

  it('blocks upload signatures once 10 images are reached', async () => {
    prisma.venue.findFirst.mockResolvedValue({
      id: 'venue-1',
      ownerId: 'owner-a',
      status: VenueStatus.DRAFT,
    });
    prisma.venueImage.count.mockResolvedValue(10);

    await expect(
      service.generateUploadSignature('owner-a', 'venue-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('verifies Cloudinary asset before saving to PostgreSQL and rejects invalid assets', async () => {
    prisma.venue.findFirst.mockResolvedValue({
      id: 'venue-1',
      ownerId: 'owner-a',
      status: VenueStatus.DRAFT,
    });
    prisma.venueImage.findMany.mockResolvedValue([]);
    cloudinaryService.verifyUploadedAsset.mockRejectedValue(
      new BadRequestException('Invalid asset scope'),
    );

    await expect(
      service.registerVerifiedImage('owner-a', 'venue-1', {
        publicId: 'https://evil.com/image.jpg',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('prevents Owner B from deleting Owner A images', async () => {
    prisma.venue.findFirst.mockResolvedValue({
      id: 'venue-1',
      ownerId: 'owner-a',
      status: VenueStatus.DRAFT,
    });

    await expect(
      service.deleteImage('owner-b', 'venue-1', 'img-1'),
    ).rejects.toThrow(ForbiddenException);
    expect(cloudinaryService.deleteAsset).not.toHaveBeenCalled();
  });
});
