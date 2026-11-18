import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { VenueStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { VenueCacheService } from '../venues/venue-cache.service.js';
import { UpdateVenueAmenitiesDto } from './dto/update-venue-amenities.dto.js';

@Injectable()
export class AmenitiesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly venueCache?: VenueCacheService,
  ) {}

  async listActiveAmenities() {
    const amenities = await this.prisma.amenity.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return {
      amenities: amenities.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        category: a.category,
        icon: a.icon,
      })),
    };
  }

  async replaceVenueAmenities(
    ownerId: string,
    venueId: string,
    dto: UpdateVenueAmenitiesDto,
  ) {
    const venue = await this.prisma.venue.findFirst({
      where: { id: venueId, archivedAt: null },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Access denied: you do not own this venue',
      );
    }

    if (venue.status === VenueStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Cannot modify amenities while the venue is pending review. Withdraw the submission first.',
      );
    }

    const uniqueIds = Array.from(new Set(dto.amenityIds));

    if (uniqueIds.length > 0) {
      const validAmenities = await this.prisma.amenity.findMany({
        where: {
          id: { in: uniqueIds },
          isActive: true,
        },
        select: { id: true },
      });

      if (validAmenities.length !== uniqueIds.length) {
        const validSet = new Set(validAmenities.map((a) => a.id));
        const invalidIds = uniqueIds.filter((id) => !validSet.has(id));
        throw new BadRequestException(
          `One or more amenity IDs are invalid or inactive: ${invalidIds.join(', ')}`,
        );
      }
    }

    const updatedAmenities = await this.prisma.$transaction(async (tx) => {
      await tx.venueAmenity.deleteMany({
        where: { venueId },
      });

      if (uniqueIds.length > 0) {
        await tx.venueAmenity.createMany({
          data: uniqueIds.map((amenityId) => ({
            venueId,
            amenityId,
          })),
          skipDuplicates: true,
        });
      }

      const records = await tx.venueAmenity.findMany({
        where: { venueId },
        include: { amenity: true },
        orderBy: { amenity: { name: 'asc' } },
      });

      return records.map((r) => ({
        id: r.amenity.id,
        name: r.amenity.name,
        slug: r.amenity.slug,
        category: r.amenity.category,
        icon: r.amenity.icon,
      }));
    });

    await this.venueCache?.invalidateAll();

    return {
      venueId,
      amenities: updatedAmenities,
    };
  }
}
