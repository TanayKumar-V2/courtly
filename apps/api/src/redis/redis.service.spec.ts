import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn<any>().mockImplementation((key: string) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new RedisService(mockConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return false for isHealthy when client is not connected', async () => {
    const isHealthy = await service.isHealthy();
    expect(isHealthy).toBe(false);
  });
});
