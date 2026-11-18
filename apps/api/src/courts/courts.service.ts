import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { CourtStatus, Prisma, VenueStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { VenueCacheService } from '../venues/venue-cache.service.js';
import { CreateCourtDto } from './dto/create-court.dto.js';
import { UpdateCourtDto } from './dto/update-court.dto.js';

@Injectable()
export class CourtsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly venueCache?: VenueCacheService,
  ) {}

  async createCourt(ownerId: string, venueId: string, dto: CreateCourtDto) {
    const venue = await this.assertOwnedVenue(ownerId, venueId, true);

    const currency = dto.currency
      ? dto.currency.trim().toUpperCase()
      : venue.currency;

    if (currency !== venue.currency) {
      throw new BadRequestException(
        `Court currency (${currency}) must match venue currency (${venue.currency})`,
      );
    }

    if (dto.basePricePerHour <= 0) {
      throw new BadRequestException('Base hourly price must be positive');
    }

    if (dto.maxPlayers <= 0) {
      throw new BadRequestException('Maximum player capacity must be positive');
    }

    if (dto.status === CourtStatus.ARCHIVED) {
      throw new BadRequestException('Cannot create a court directly in ARCHIVED status');
    }

    const court = await this.prisma.court.create({
      data: {
        venueId,
        name: dto.name.trim(),
        sport: dto.sport,
        description: dto.description?.trim() || null,
        surfaceType: dto.surfaceType?.trim() || null,
        indoor: dto.indoor ?? false,
        maxPlayers: dto.maxPlayers,
        basePricePerHour: new Prisma.Decimal(dto.basePricePerHour.toFixed(2)),
        currency: venue.currency,
        status: dto.status ?? CourtStatus.ACTIVE,
      },
    });

    await this.venueCache?.invalidateAll();

    return {
      message: 'Court created successfully',
      court: this.formatCourt(court),
    };
  }

  async listVenueCourts(ownerId: string, venueId: string) {
    await this.assertOwnedVenue(ownerId, venueId, false);

    const courts = await this.prisma.court.findMany({
      where: {
        venueId,
        status: { not: CourtStatus.ARCHIVED },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      venueId,
      courts: courts.map((c) => this.formatCourt(c)),
    };
  }

  async getVenueCourtById(ownerId: string, venueId: string, courtId: string) {
    await this.assertOwnedVenue(ownerId, venueId, false);

    const court = await this.prisma.court.findFirst({
      where: { id: courtId, venueId },
    });

    if (!court) {
      throw new NotFoundException('Court not found in this venue');
    }

    return {
      court: this.formatCourt(court),
    };
  }

  async updateCourt(
    ownerId: string,
    venueId: string,
    courtId: string,
    dto: UpdateCourtDto,
  ) {
    const venue = await this.assertOwnedVenue(ownerId, venueId, true);

    const existing = await this.prisma.court.findFirst({
      where: { id: courtId, venueId },
    });

    if (!existing) {
      throw new NotFoundException('Court not found in this venue');
    }

    if (existing.status === CourtStatus.ARCHIVED) {
      throw new BadRequestException('Archived courts cannot be modified');
    }

    if (dto.currency && dto.currency.trim().toUpperCase() !== venue.currency) {
      throw new BadRequestException(
        `Court currency (${dto.currency}) must match venue currency (${venue.currency})`,
      );
    }

    if (dto.basePricePerHour !== undefined && dto.basePricePerHour <= 0) {
      throw new BadRequestException('Base hourly price must be positive');
    }

    if (dto.maxPlayers !== undefined && dto.maxPlayers <= 0) {
      throw new BadRequestException('Maximum player capacity must be positive');
    }

    const updateData: Prisma.CourtUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.sport !== undefined) updateData.sport = dto.sport;
    if (dto.description !== undefined)
      updateData.description = dto.description ? dto.description.trim() : null;
    if (dto.surfaceType !== undefined)
      updateData.surfaceType = dto.surfaceType ? dto.surfaceType.trim() : null;
    if (dto.indoor !== undefined) updateData.indoor = dto.indoor;
    if (dto.maxPlayers !== undefined) updateData.maxPlayers = dto.maxPlayers;
    if (dto.basePricePerHour !== undefined) {
      updateData.basePricePerHour = new Prisma.Decimal(
        dto.basePricePerHour.toFixed(2),
      );
    }
    if (dto.status !== undefined) updateData.status = dto.status;

    const updated = await this.prisma.court.update({
      where: { id: courtId },
      data: updateData,
    });

    await this.venueCache?.invalidateAll();

    return {
      message: 'Court updated successfully',
      court: this.formatCourt(updated),
    };
  }

  async archiveOrDeleteCourt(
    ownerId: string,
    venueId: string,
    courtId: string,
  ) {
    const venue = await this.assertOwnedVenue(ownerId, venueId, true);

    const existing = await this.prisma.court.findFirst({
      where: { id: courtId, venueId },
    });

    if (!existing) {
      throw new NotFoundException('Court not found in this venue');
    }

    // Archive rather than hard-delete for non-draft venues to preserve future booking references
    if (venue.status === VenueStatus.DRAFT && !venue.publishedAt) {
      await this.prisma.court.delete({ where: { id: courtId } });
      return {
        message: 'Court removed from draft venue',
        archived: false,
      };
    }

    await this.prisma.court.update({
      where: { id: courtId },
      data: { status: CourtStatus.ARCHIVED },
    });

    await this.venueCache?.invalidateAll();

    return {
      message: 'Court archived successfully',
      archived: true,
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
        'Cannot modify courts while the venue is pending review. Withdraw the submission first.',
      );
    }

    return venue;
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
      currency: court.currency,
      status: court.status,
      createdAt: court.createdAt,
      updatedAt: court.updatedAt,
    };
  }
}
