import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  OwnerApplicationStatus,
  Role,
  UserStatus,
  VenueStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { VENUE_FULL_INCLUDE } from '../venues/venues.repository.js';
import { VenuesService } from '../venues/venues.service.js';
import { VenueCacheService } from '../venues/venue-cache.service.js';
import {
  AdminQueryApplicationsDto,
  AdminQueryVenuesDto,
} from './dto/admin-query.dto.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly venuesService: VenuesService,
    @Optional() private readonly venueCache?: VenueCacheService,
  ) {}

  // =========================================================
  // OWNER APPLICATION MODERATION
  // =========================================================

  async listOwnerApplications(query: AdminQueryApplicationsDto) {
    const where = query.status ? { status: query.status } : {};
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.prisma.ownerApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              status: true,
              emailVerifiedAt: true,
            },
          },
          reviewedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.ownerApplication.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async getOwnerApplicationById(applicationId: string) {
    const application = await this.prisma.ownerApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            status: true,
            emailVerifiedAt: true,
            roles: true,
          },
        },
        reviewedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Owner application not found');
    }

    return { application };
  }

  async approveOwnerApplication(adminId: string, applicationId: string) {
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const application = await tx.ownerApplication.findUnique({
        where: { id: applicationId },
        include: { user: true },
      });

      if (!application) {
        throw new NotFoundException('Owner application not found');
      }

      if (application.userId === adminId) {
        throw new ForbiddenException(
          'Administrators cannot approve their own owner application',
        );
      }

      if (application.status !== OwnerApplicationStatus.PENDING) {
        throw new ConflictException(
          `Application cannot be approved because its status is ${application.status}`,
        );
      }

      if (
        !application.user ||
        application.user.status !== UserStatus.ACTIVE ||
        !application.user.emailVerifiedAt
      ) {
        throw new BadRequestException(
          'Applicant account is not active or email-verified',
        );
      }

      // Atomic conditional update prevents concurrent duplicate approval
      const updatedCount = await tx.ownerApplication.updateMany({
        where: {
          id: applicationId,
          status: OwnerApplicationStatus.PENDING,
        },
        data: {
          status: OwnerApplicationStatus.APPROVED,
          reviewedById: adminId,
          reviewedAt: now,
          rejectionReason: null,
        },
      });

      if (updatedCount.count === 0) {
        throw new ConflictException(
          'Application was already reviewed by another administrator',
        );
      }

      // Grant VENUE_OWNER role safely (idempotent upsert)
      await tx.userRole.upsert({
        where: {
          userId_role: {
            userId: application.userId,
            role: Role.VENUE_OWNER,
          },
        },
        create: {
          userId: application.userId,
          role: Role.VENUE_OWNER,
        },
        update: {},
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          entityType: 'OWNER_APPLICATION',
          entityId: applicationId,
          action: 'APPROVE',
          metadata: {
            applicantUserId: application.userId,
            businessName: application.businessName,
          },
        },
      });

      return tx.ownerApplication.findUnique({
        where: { id: applicationId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              roles: true,
            },
          },
        },
      });
    });

    return {
      message:
        'Owner application approved and VENUE_OWNER role granted successfully.',
      application: result,
    };
  }

  async rejectOwnerApplication(
    adminId: string,
    applicationId: string,
    reason: string,
  ) {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const application = await tx.ownerApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Owner application not found');
      }

      if (application.userId === adminId) {
        throw new ForbiddenException(
          'Administrators cannot review their own owner application',
        );
      }

      if (application.status !== OwnerApplicationStatus.PENDING) {
        throw new ConflictException(
          `Application cannot be rejected because its status is ${application.status}`,
        );
      }

      const updatedCount = await tx.ownerApplication.updateMany({
        where: {
          id: applicationId,
          status: OwnerApplicationStatus.PENDING,
        },
        data: {
          status: OwnerApplicationStatus.REJECTED,
          reviewedById: adminId,
          reviewedAt: now,
          rejectionReason: trimmedReason,
        },
      });

      if (updatedCount.count === 0) {
        throw new ConflictException(
          'Application was already reviewed by another administrator',
        );
      }

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          entityType: 'OWNER_APPLICATION',
          entityId: applicationId,
          action: 'REJECT',
          reason: trimmedReason,
          metadata: {
            applicantUserId: application.userId,
            businessName: application.businessName,
          },
        },
      });

      return tx.ownerApplication.findUnique({
        where: { id: applicationId },
      });
    });

    return {
      message: 'Owner application rejected',
      application: updated,
    };
  }

  // =========================================================
  // VENUE MODERATION
  // =========================================================

  async listVenuesForModeration(query: AdminQueryVenuesDto) {
    const where: Record<string, any> = {
      archivedAt: null,
      status: query.status
        ? query.status
        : {
            in: [
              VenueStatus.PENDING_REVIEW,
              VenueStatus.APPROVED,
              VenueStatus.REJECTED,
              VenueStatus.PAUSED,
            ],
          },
    };

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.prisma.venue.findMany({
        where,
        include: {
          ...VENUE_FULL_INCLUDE,
          owner: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.venue.count({ where }),
    ]);

    return {
      data: items.map((v) => ({
        ...this.venuesService.formatOwnerVenue(v),
        owner: v.owner,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async getVenueForModeration(venueId: string) {
    const venue = await this.prisma.venue.findFirst({
      where: { id: venueId, archivedAt: null },
      include: {
        ...VENUE_FULL_INCLUDE,
        owner: {
          select: { id: true, fullName: true, email: true },
        },
        reviewedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const auditLogs = await this.prisma.adminAuditLog.findMany({
      where: { entityType: 'VENUE', entityId: venueId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      venue: {
        ...this.venuesService.formatOwnerVenue(venue),
        owner: venue.owner,
        reviewedBy: venue.reviewedBy,
      },
      auditLogs,
    };
  }

  async approveVenue(adminId: string, venueId: string) {
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const venue = await tx.venue.findFirst({
        where: { id: venueId, archivedAt: null },
        include: VENUE_FULL_INCLUDE,
      });

      if (!venue) {
        throw new NotFoundException('Venue not found');
      }

      if (venue.ownerId === adminId) {
        throw new ForbiddenException(
          'Venue owners cannot approve their own venue listing',
        );
      }

      if (
        venue.status !== VenueStatus.PENDING_REVIEW &&
        venue.status !== VenueStatus.PAUSED
      ) {
        throw new ConflictException(
          `Only PENDING_REVIEW or PAUSED venues can be approved (current status: ${venue.status})`,
        );
      }

      const completion = this.venuesService.computeListingCompletion(venue);
      if (!completion.isReadyToSubmit) {
        throw new BadRequestException(
          `Venue cannot be approved because required listing details are missing: ${completion.missingRequirements.join(', ')}`,
        );
      }

      const result = await tx.venue.update({
        where: { id: venueId },
        data: {
          status: VenueStatus.APPROVED,
          reviewedById: adminId,
          reviewedAt: now,
          publishedAt: venue.publishedAt ?? now,
          rejectionReason: null,
        },
        include: VENUE_FULL_INCLUDE,
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          entityType: 'VENUE',
          entityId: venueId,
          action: 'APPROVE',
          metadata: {
            previousStatus: venue.status,
            venueName: venue.name,
            ownerId: venue.ownerId,
          },
        },
      });

      return result;
    });

    await this.venueCache?.invalidateAll();

    return {
      message: 'Venue approved and is now publicly visible',
      venue: this.venuesService.formatOwnerVenue(updated),
    };
  }

  async rejectVenue(adminId: string, venueId: string, reason: string) {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new BadRequestException('A rejection reason is required');
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const venue = await tx.venue.findFirst({
        where: { id: venueId, archivedAt: null },
      });

      if (!venue) {
        throw new NotFoundException('Venue not found');
      }

      if (venue.ownerId === adminId) {
        throw new ForbiddenException(
          'Venue owners cannot moderate their own venue listing',
        );
      }

      if (venue.status !== VenueStatus.PENDING_REVIEW) {
        throw new ConflictException(
          `Only PENDING_REVIEW venues can be rejected (current status: ${venue.status})`,
        );
      }

      const result = await tx.venue.update({
        where: { id: venueId },
        data: {
          status: VenueStatus.REJECTED,
          reviewedById: adminId,
          reviewedAt: now,
          rejectionReason: trimmedReason,
        },
        include: VENUE_FULL_INCLUDE,
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          entityType: 'VENUE',
          entityId: venueId,
          action: 'REJECT',
          reason: trimmedReason,
          metadata: {
            previousStatus: venue.status,
            venueName: venue.name,
            ownerId: venue.ownerId,
          },
        },
      });

      return result;
    });

    return {
      message: 'Venue rejected. Owner may edit and resubmit the listing.',
      venue: this.venuesService.formatOwnerVenue(updated),
    };
  }

  async pauseVenue(adminId: string, venueId: string, reason?: string) {
    const now = new Date();
    const trimmedReason = reason?.trim() || 'Paused by administrator moderation';

    const updated = await this.prisma.$transaction(async (tx) => {
      const venue = await tx.venue.findFirst({
        where: { id: venueId, archivedAt: null },
      });

      if (!venue) {
        throw new NotFoundException('Venue not found');
      }

      if (venue.status === VenueStatus.PAUSED) {
        throw new ConflictException('Venue is already paused');
      }

      const result = await tx.venue.update({
        where: { id: venueId },
        data: {
          status: VenueStatus.PAUSED,
          reviewedById: adminId,
          reviewedAt: now,
          rejectionReason: trimmedReason,
        },
        include: VENUE_FULL_INCLUDE,
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          entityType: 'VENUE',
          entityId: venueId,
          action: 'PAUSE',
          reason: trimmedReason,
          metadata: {
            previousStatus: venue.status,
            venueName: venue.name,
            ownerId: venue.ownerId,
          },
        },
      });

      return result;
    });

    await this.venueCache?.invalidateAll();

    return {
      message: 'Venue paused and removed from public discovery',
      venue: this.venuesService.formatOwnerVenue(updated),
    };
  }
}
