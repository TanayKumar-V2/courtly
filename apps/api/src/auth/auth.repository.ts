import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role, Sport, UserStatus } from '@prisma/client';

export interface CreateUserData {
  fullName: string;
  email: string;
  passwordHash: string;
  city?: string;
  preferredSports?: Sport[];
  verificationTokenHash: string;
  verificationExpiresAt: Date;
}

export interface CreateSessionData {
  userId: string;
  deviceName?: string;
  platform?: string;
  tokenHash: string;
  familyId: string;
  sessionExpiresAt: Date;
  refreshExpiresAt: Date;
}

export interface RotateResult {
  status: 'SUCCESS' | 'REUSE_DETECTED' | 'EXPIRED' | 'NOT_FOUND' | 'SESSION_INVALID';
  session?: any;
  newRefreshToken?: any;
  userId?: string;
}

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async createUserWithProfileAndToken(data: CreateUserData) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          passwordHash: data.passwordHash,
          status: UserStatus.PENDING_VERIFICATION,
          roles: {
            create: {
              role: Role.PLAYER,
            },
          },
          profile: {
            create: {
              city: data.city,
              preferredSports: data.preferredSports || [],
            },
          },
          emailVerificationTokens: {
            create: {
              tokenHash: data.verificationTokenHash,
              expiresAt: data.verificationExpiresAt,
            },
          },
        },
        include: {
          roles: true,
          profile: true,
        },
      });

      return user;
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
        profile: true,
        sportSkills: true,
      },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        profile: true,
        sportSkills: true,
      },
    });
  }

  async createSessionAndRefreshToken(data: CreateSessionData) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.userSession.create({
        data: {
          userId: data.userId,
          deviceName: data.deviceName,
          platform: data.platform,
          expiresAt: data.sessionExpiresAt,
        },
      });

      const refreshToken = await tx.refreshToken.create({
        data: {
          sessionId: session.id,
          tokenHash: data.tokenHash,
          familyId: data.familyId,
          expiresAt: data.refreshExpiresAt,
        },
      });

      return { session, refreshToken };
    });
  }

  async rotateRefreshToken(
    oldTokenHash: string,
    newTokenHash: string,
    newRefreshExpiresAt: Date,
  ): Promise<RotateResult> {
    return this.prisma.$transaction(async (tx) => {
      const existingToken = await tx.refreshToken.findUnique({
        where: { tokenHash: oldTokenHash },
        include: { session: true },
      });

      if (!existingToken) {
        return { status: 'NOT_FOUND' };
      }

      // REUSE DETECTION: If token was already consumed or revoked, revoke entire family!
      if (existingToken.usedAt !== null || existingToken.revokedAt !== null) {
        this.logger.warn(
          `Token reuse detected for family ${existingToken.familyId}! Revoking entire token family.`,
        );

        await tx.refreshToken.updateMany({
          where: { familyId: existingToken.familyId },
          data: { revokedAt: new Date() },
        });

        await tx.userSession.update({
          where: { id: existingToken.sessionId },
          data: { revokedAt: new Date() },
        });

        return {
          status: 'REUSE_DETECTED',
          userId: existingToken.session?.userId,
        };
      }

      // Check token expiration
      if (existingToken.expiresAt < new Date()) {
        await tx.refreshToken.update({
          where: { id: existingToken.id },
          data: { revokedAt: new Date() },
        });
        return { status: 'EXPIRED' };
      }

      // Check session validity
      if (
        !existingToken.session ||
        existingToken.session.revokedAt !== null ||
        existingToken.session.expiresAt < new Date()
      ) {
        return { status: 'SESSION_INVALID' };
      }

      // Create replacement token in the same family
      const replacementToken = await tx.refreshToken.create({
        data: {
          sessionId: existingToken.sessionId,
          tokenHash: newTokenHash,
          familyId: existingToken.familyId,
          expiresAt: newRefreshExpiresAt,
        },
      });

      // Mark old token as used and point to replacement
      await tx.refreshToken.update({
        where: { id: existingToken.id },
        data: {
          usedAt: new Date(),
          replacedByTokenId: replacementToken.id,
        },
      });

      // Update session activity
      const updatedSession = await tx.userSession.update({
        where: { id: existingToken.sessionId },
        data: { lastUsedAt: new Date() },
      });

      return {
        status: 'SUCCESS',
        session: updatedSession,
        newRefreshToken: replacementToken,
        userId: existingToken.session.userId,
      };
    });
  }

  async revokeSessionAndFamily(sessionId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userSession.updateMany({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });

      await tx.refreshToken.updateMany({
        where: { sessionId },
        data: { revokedAt: new Date() },
      });
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const userSessions = await tx.userSession.findMany({
        where: { userId, revokedAt: null },
        select: { id: true },
      });

      const sessionIds = userSessions.map((s) => s.id);

      if (sessionIds.length > 0) {
        await tx.userSession.updateMany({
          where: { id: { in: sessionIds } },
          data: { revokedAt: new Date() },
        });

        await tx.refreshToken.updateMany({
          where: { sessionId: { in: sessionIds } },
          data: { revokedAt: new Date() },
        });
      }
    });
  }

  async verifyEmailToken(tokenHash: string): Promise<{ success: boolean; reason?: string }> {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.emailVerificationToken.findUnique({
        where: { tokenHash },
      });

      if (!record) {
        return { success: false, reason: 'Invalid verification token' };
      }

      if (record.usedAt !== null) {
        return { success: false, reason: 'Verification token has already been used' };
      }

      if (record.expiresAt < new Date()) {
        return { success: false, reason: 'Verification token has expired' };
      }

      await tx.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });

      await tx.user.update({
        where: { id: record.userId },
        data: {
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      });

      return { success: true };
    });
  }

  async createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async resetPasswordWithToken(
    tokenHash: string,
    newPasswordHash: string,
  ): Promise<{ success: boolean; reason?: string }> {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
      });

      if (!record) {
        return { success: false, reason: 'Invalid password reset token' };
      }

      if (record.usedAt !== null) {
        return { success: false, reason: 'Password reset token has already been used' };
      }

      if (record.expiresAt < new Date()) {
        return { success: false, reason: 'Password reset token has expired' };
      }

      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });

      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash: newPasswordHash },
      });

      // Revoke all existing sessions on password reset for security
      await tx.userSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return { success: true };
    });
  }

  async updatePasswordAndRevokeSessions(userId: string, newPasswordHash: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      await tx.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }
}
