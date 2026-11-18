import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { OwnerApplicationStatus, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOwnerApplicationDto } from './dto/create-owner-application.dto.js';

@Injectable()
export class OwnerApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitApplication(userId: string, dto: CreateOwnerApplicationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      throw new ForbiddenException('User account not found');
    }

    if (user.status !== UserStatus.ACTIVE || !user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Email verification is required before applying to become a venue owner',
      );
    }

    const isAlreadyOwner = user.roles.some((r) => r.role === Role.VENUE_OWNER);
    if (isAlreadyOwner) {
      throw new ConflictException(
        'Your account already has verified Venue Owner permissions',
      );
    }

    const existingPending = await this.prisma.ownerApplication.findFirst({
      where: {
        userId,
        status: OwnerApplicationStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new ConflictException(
        'You already have a pending venue owner application under review',
      );
    }

    // Retry policy check: if previously rejected, allow reapplication with full history preserved
    const latestRejected = await this.prisma.ownerApplication.findFirst({
      where: {
        userId,
        status: OwnerApplicationStatus.REJECTED,
      },
      orderBy: { createdAt: 'desc' },
    });

    const cooldownHours = parseInt(
      process.env.OWNER_APP_RETRY_COOLDOWN_HOURS || '0',
      10,
    );
    if (latestRejected && cooldownHours > 0 && latestRejected.reviewedAt) {
      const retryEligibleAt = new Date(
        latestRejected.reviewedAt.getTime() + cooldownHours * 60 * 60 * 1000,
      );
      if (retryEligibleAt > new Date()) {
        throw new BadRequestException(
          `You can submit a new application after ${retryEligibleAt.toISOString()}`,
        );
      }
    }

    const application = await this.prisma.ownerApplication.create({
      data: {
        userId,
        businessName: dto.businessName.trim(),
        businessType: dto.businessType.trim(),
        contactPerson: dto.contactPerson.trim(),
        contactPhone: dto.contactPhone.trim(),
        city: dto.city.trim(),
        state: dto.state.trim(),
        country: dto.country.trim(),
        additionalInformation: dto.additionalInformation?.trim() || '',
        status: OwnerApplicationStatus.PENDING,
      },
    });

    return {
      message: 'Venue owner application submitted successfully and is pending admin review.',
      application: this.formatApplication(application),
    };
  }

  async getMyApplicationStatus(userId: string) {
    const [user, applications] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      }),
      this.prisma.ownerApplication.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const isVenueOwner = Boolean(
      user?.roles.some((r) => r.role === Role.VENUE_OWNER),
    );
    const latestApplication = applications[0] ?? null;
    const hasPending = applications.some(
      (a) => a.status === OwnerApplicationStatus.PENDING,
    );

    const canApply =
      !isVenueOwner &&
      !hasPending &&
      user?.status === UserStatus.ACTIVE &&
      Boolean(user?.emailVerifiedAt);

    return {
      isVenueOwner,
      canApply,
      latestApplication: latestApplication
        ? this.formatApplication(latestApplication)
        : null,
      history: applications.map((a) => this.formatApplication(a)),
    };
  }

  private formatApplication(app: any) {
    return {
      id: app.id,
      userId: app.userId,
      businessName: app.businessName,
      businessType: app.businessType,
      contactPerson: app.contactPerson,
      contactPhone: app.contactPhone,
      city: app.city,
      state: app.state,
      country: app.country,
      additionalInformation: app.additionalInformation,
      status: app.status,
      reviewedAt: app.reviewedAt,
      rejectionReason: app.rejectionReason,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }
}
