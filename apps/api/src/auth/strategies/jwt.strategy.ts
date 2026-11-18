import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JwtPayload } from '../services/token.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret =
      configService.get<string>('JWT_ACCESS_SECRET') ||
      process.env.JWT_ACCESS_SECRET ||
      'courtly_super_secure_jwt_access_secret_key_2026_dev_mode';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer: 'courtly-api',
      audience: 'courtly-app',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.sid) {
      throw new UnauthorizedException('Invalid token credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: true,
        sessions: {
          where: {
            id: payload.sid,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('User account has been suspended');
    }

    if (!user.sessions || user.sessions.length === 0) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles: user.roles.map((r) => r.role),
      sessionId: payload.sid,
    };
  }
}
