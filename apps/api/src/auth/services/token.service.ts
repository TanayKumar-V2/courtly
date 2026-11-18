import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as crypto from 'node:crypto';

export interface JwtPayload {
  sub: string;
  sid: string;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

@Injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly issuer = 'courtly-api';
  private readonly audience = 'courtly-app';

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      process.env.JWT_ACCESS_SECRET ||
      'courtly_super_secure_jwt_access_secret_key_2026_dev_mode';
    this.jwtExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
      process.env.JWT_ACCESS_EXPIRES_IN ||
      '15m';
  }

  /**
   * Signs a short-lived (15m) JWT access token with user ID and session ID.
   */
  async signAccessToken(userId: string, sessionId: string): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      sid: sessionId,
    };

    const options: JwtSignOptions = {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn as any,
      issuer: this.issuer,
      audience: this.audience,
    };

    return this.jwtService.signAsync(payload, options);
  }

  /**
   * Verifies a JWT access token, enforcing issuer, audience, and secret.
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.jwtSecret,
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  /**
   * Generates a cryptographically strong opaque random token with at least 256 bits of entropy.
   */
  generateRandomToken(byteLength = 32): string {
    return crypto.randomBytes(byteLength).toString('hex');
  }

  /**
   * Hashes a token using SHA-256 for persistent database storage.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
