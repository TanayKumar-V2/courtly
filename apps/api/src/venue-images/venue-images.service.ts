import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { VenueStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { VenueCacheService } from '../venues/venue-cache.service.js';
import {
  CloudinaryService,
  MAX_IMAGES_PER_VENUE,
} from '../cloudinary/cloudinary.service.js';
import { RegisterVenueImageDto } from './dto/register-venue-image.dto.js';
import { ReorderVenueImagesDto } from './dto/reorder-venue-images.dto.js';

@Injectable()
export class VenueImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    @Optional() private readonly venueCache?: VenueCacheService,
  ) {}

  async generateUploadSignature(ownerId: string, venueId: string) {
    await this.assertOwnedVenue(ownerId, venueId, true);

    const existingCount = await this.prisma.venueImage.count({
      where: { venueId },
    });

    if (existingCount >= MAX_IMAGES_PER_VENUE) {
      throw new BadRequestException(
        `Maximum limit of ${MAX_IMAGES_PER_VENUE} photographs per venue reached`,
      );
    }

    const signed = this.cloudinaryService.generateSignedUploadParams(
      ownerId,
      venueId,
    );

    return {
      ...signed,
      remainingSlots: MAX_IMAGES_PER_VENUE - existingCount,
    };
  }

  async registerVerifiedImage(
    ownerId: string,
    venueId: string,
    dto: RegisterVenueImageDto,
  ) {
    await this.assertOwnedVenue(ownerId, venueId, true);

    const existingImages = await this.prisma.venueImage.findMany({
      where: { venueId },
      orderBy: { position: 'asc' },
    });

    if (existingImages.length >= MAX_IMAGES_PER_VENUE) {
      throw new BadRequestException(
        `Maximum limit of ${MAX_IMAGES_PER_VENUE} photographs per venue reached`,
      );
    }

    // Verify uploaded asset via Cloudinary Admin API BEFORE persisting to PostgreSQL
    const verified = await this.cloudinaryService.verifyUploadedAsset(
      dto.publicId,
      ownerId,
      venueId,
    );

    const duplicate = await this.prisma.venueImage.findUnique({
      where: { publicId: verified.publicId },
    });
    if (duplicate) {
      throw new ConflictException('This image has already been registered');
    }

    const shouldBeCover = existingImages.length === 0 || Boolean(dto.isCover);
    const nextPosition =
      existingImages.length > 0
        ? Math.max(...existingImages.map((i) => i.position)) + 1
        : 0;

    const createdImage = await this.prisma.$transaction(async (tx) => {
      if (shouldBeCover && existingImages.length > 0) {
        await tx.venueImage.updateMany({
          where: { venueId },
          data: { isCover: false },
        });
      }

      return tx.venueImage.create({
        data: {
          venueId,
          publicId: verified.publicId,
          secureUrl: verified.secureUrl,
          width: verified.width,
          height: verified.height,
          format: verified.format,
          bytes: verified.bytes,
          position: nextPosition,
          isCover: shouldBeCover,
        },
      });
    });

    await this.venueCache?.invalidateAll();

    return {
      message: 'Venue image verified and saved successfully',
      image: createdImage,
    };
  }

  async deleteImage(ownerId: string, venueId: string, imageId: string) {
    await this.assertOwnedVenue(ownerId, venueId, true);

    const image = await this.prisma.venueImage.findFirst({
      where: { id: imageId, venueId },
    });

    if (!image) {
      throw new NotFoundException('Venue image not found');
    }

    // Delete from Cloudinary FIRST; do not drop DB record if Cloudinary deletion fails
    await this.cloudinaryService.deleteAsset(image.publicId);

    const remainingImages = await this.prisma.$transaction(async (tx) => {
      await tx.venueImage.delete({ where: { id: image.id } });

      const remaining = await tx.venueImage.findMany({
        where: { venueId },
        orderBy: { position: 'asc' },
      });

      // Automatically promote another image as cover if the deleted image was cover
      if (image.isCover && remaining.length > 0) {
        const hasOtherCover = remaining.some((img) => img.isCover);
        if (!hasOtherCover) {
          await tx.venueImage.update({
            where: { id: remaining[0].id },
            data: { isCover: true },
          });
          remaining[0].isCover = true;
        }
      }

      // Normalize positions sequentially
      for (let idx = 0; idx < remaining.length; idx++) {
        if (remaining[idx].position !== idx) {
          await tx.venueImage.update({
            where: { id: remaining[idx].id },
            data: { position: idx },
          });
          remaining[idx].position = idx;
        }
      }

      return remaining;
    });

    await this.venueCache?.invalidateAll();

    return {
      message: 'Venue image deleted successfully',
      images: remainingImages,
    };
  }

  async reorderImages(
    ownerId: string,
    venueId: string,
    dto: ReorderVenueImagesDto,
  ) {
    await this.assertOwnedVenue(ownerId, venueId, true);

    const existing = await this.prisma.venueImage.findMany({
      where: { venueId },
      select: { id: true },
    });

    const existingIdSet = new Set(existing.map((i) => i.id));
    if (
      dto.imageIds.length !== existing.length ||
      dto.imageIds.some((id) => !existingIdSet.has(id))
    ) {
      throw new BadRequestException(
        'Reorder payload must include every image ID belonging to this venue exactly once',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (let index = 0; index < dto.imageIds.length; index++) {
        await tx.venueImage.update({
          where: { id: dto.imageIds[index] },
          data: { position: index },
        });
      }

      return tx.venueImage.findMany({
        where: { venueId },
        orderBy: { position: 'asc' },
      });
    });

    return {
      message: 'Venue images reordered successfully',
      images: updated,
    };
  }

  async setCoverImage(ownerId: string, venueId: string, imageId: string) {
    await this.assertOwnedVenue(ownerId, venueId, true);

    const target = await this.prisma.venueImage.findFirst({
      where: { id: imageId, venueId },
    });

    if (!target) {
      throw new NotFoundException('Venue image not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.venueImage.updateMany({
        where: { venueId },
        data: { isCover: false },
      });

      await tx.venueImage.update({
        where: { id: imageId },
        data: { isCover: true },
      });

      return tx.venueImage.findMany({
        where: { venueId },
        orderBy: [{ isCover: 'desc' }, { position: 'asc' }],
      });
    });

    await this.venueCache?.invalidateAll();

    return {
      message: 'Cover image updated successfully',
      images: updated,
    };
  }

  private async assertOwnedVenue(
    ownerId: string,
    venueId: string,
    requireEditable: boolean,
  ) {
    const venue = await this.prisma.venue.findFirst({
      where: { id: venueId, archivedAt: null },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied: you do not own this venue');
    }

    if (requireEditable && venue.status === VenueStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Cannot modify images while the venue is pending review. Withdraw the submission first.',
      );
    }

    return venue;
  }
}
