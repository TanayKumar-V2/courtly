import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdatePlayerProfileDto } from './dto/update-player-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        profile: true,
        sportSkills: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserProfile(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const data: Record<string, any> = {};
    if (dto.fullName !== undefined) {
      data.fullName = dto.fullName.trim();
    }
    if (dto.phoneNumber !== undefined) {
      data.phoneNumber = dto.phoneNumber.trim();
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        roles: true,
        profile: true,
        sportSkills: true,
      },
    });

    return this.formatUserProfile(updatedUser);
  }

  async updatePlayerProfile(userId: string, dto: UpdatePlayerProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      // Upsert the PlayerProfile record
      await tx.playerProfile.upsert({
        where: { userId },
        create: {
          userId,
          bio: dto.bio,
          city: dto.city,
          state: dto.state,
          country: dto.country,
          preferredSports: dto.preferredSports || [],
        },
        update: {
          bio: dto.bio !== undefined ? dto.bio : undefined,
          city: dto.city !== undefined ? dto.city : undefined,
          state: dto.state !== undefined ? dto.state : undefined,
          country: dto.country !== undefined ? dto.country : undefined,
          preferredSports:
            dto.preferredSports !== undefined ? dto.preferredSports : undefined,
        },
      });

      // Upsert sport skill levels if provided
      if (dto.sportSkills && dto.sportSkills.length > 0) {
        for (const skill of dto.sportSkills) {
          await tx.playerSportSkill.upsert({
            where: {
              userId_sport: {
                userId,
                sport: skill.sport,
              },
            },
            create: {
              userId,
              sport: skill.sport,
              skillLevel: skill.skillLevel,
            },
            update: {
              skillLevel: skill.skillLevel,
            },
          });
        }
      }

      // Fetch updated full user details
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          roles: true,
          profile: true,
          sportSkills: true,
        },
      });

      return this.formatUserProfile(user!);
    });
  }

  private formatUserProfile(user: any) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      emailVerified:
        user.emailVerifiedAt !== null || user.status === 'ACTIVE',
      emailVerifiedAt: user.emailVerifiedAt,
      status: user.status,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      roles: user.roles ? user.roles.map((r: any) => r.role) : [],
      profile: user.profile
        ? {
            id: user.profile.id,
            bio: user.profile.bio,
            city: user.profile.city,
            state: user.profile.state,
            country: user.profile.country,
            preferredSports: user.profile.preferredSports,
            createdAt: user.profile.createdAt,
            updatedAt: user.profile.updatedAt,
          }
        : null,
      sportSkills: user.sportSkills
        ? user.sportSkills.map((s: any) => ({
            sport: s.sport,
            skillLevel: s.skillLevel,
          }))
        : [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
