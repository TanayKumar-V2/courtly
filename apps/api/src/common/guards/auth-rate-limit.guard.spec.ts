import { describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRateLimitGuard } from './auth-rate-limit.guard.js';
import { RedisService } from '../../redis/redis.service.js';

describe('AuthRateLimitGuard', () => {
  const reflector = new Reflector();

  function createMockContext(ip: string, email?: string): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          headers: {},
          body: email ? { email } : {},
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow request when no rate limit decorator is applied', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const mockRedis = { getClient: () => null } as unknown as RedisService;

    const guard = new AuthRateLimitGuard(reflector, mockRedis);
    const context = createMockContext('127.0.0.1');

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow request when within rate limit threshold', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
      limit: 5,
      ttlSeconds: 60,
      keyPrefix: 'test',
    });

    const mockExec = jest.fn<() => Promise<any>>().mockResolvedValue([
      [null, 2],
      [null, 58],
    ]);

    const mockPipeline = {
      incr: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: mockExec,
    };

    const mockRedisClient = {
      pipeline: () => mockPipeline,
      expire: jest.fn<() => Promise<any>>().mockResolvedValue(1),
    };

    const mockRedisService = {
      getClient: () => mockRedisClient,
    } as unknown as RedisService;

    const guard = new AuthRateLimitGuard(reflector, mockRedisService);
    const context = createMockContext('192.168.1.10', 'player@example.com');

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw 429 TooManyRequests when limit is exceeded', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
      limit: 3,
      ttlSeconds: 60,
      keyPrefix: 'test',
    });

    const mockExec = jest.fn<() => Promise<any>>().mockResolvedValue([
      [null, 4],
      [null, 45],
    ]);

    const mockPipeline = {
      incr: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: mockExec,
    };

    const mockRedisClient = {
      pipeline: () => mockPipeline,
    };

    const mockRedisService = {
      getClient: () => mockRedisClient,
    } as unknown as RedisService;

    const guard = new AuthRateLimitGuard(reflector, mockRedisService);
    const context = createMockContext('192.168.1.10', 'player@example.com');

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
    try {
      await guard.canActivate(context);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });
});
