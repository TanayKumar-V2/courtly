import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'node:crypto';
import { RedisService } from '../../redis/redis.service.js';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator.js';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AuthRateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no rate limit options set on handler or class, permit by default
    if (!options) {
      return true;
    }

    const client = this.redisService.getClient();
    if (!client) {
      this.logger.warn('Redis client unavailable; bypassing rate limit check');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const rawIp =
      request.headers['x-forwarded-for'] ||
      request.ip ||
      request.socket?.remoteAddress ||
      '127.0.0.1';
    const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(',')[0].trim();

    let identifier = ip;
    if (request.body && typeof request.body.email === 'string') {
      const emailHash = crypto
        .createHash('sha256')
        .update(request.body.email.trim().toLowerCase())
        .digest('hex')
        .slice(0, 16);
      identifier = `${ip}:${emailHash}`;
    }

    const prefix = options.keyPrefix || 'auth';
    const rateLimitKey = `courtly:ratelimit:${prefix}:${identifier}`;

    try {
      const pipeline = client.pipeline();
      pipeline.incr(rateLimitKey);
      pipeline.ttl(rateLimitKey);
      const results = await pipeline.exec();

      if (!results || results.length < 2) {
        return true;
      }

      const count = (results[0][1] as number) || 1;
      const ttl = (results[1][1] as number) || -1;

      // If key is new or has no TTL, set expiration
      if (ttl === -1) {
        await client.expire(rateLimitKey, options.ttlSeconds);
      }

      if (count > options.limit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests. Please try again later.',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.warn(`Redis rate limit error: ${(err as Error).message}`);
      // Fail open on Redis network error to prevent total denial of service
      return true;
    }
  }
}
