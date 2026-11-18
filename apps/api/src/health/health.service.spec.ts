import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { HealthService } from './health.service';
import { RedisService } from '../redis/redis.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockRedisService: jest.Mocked<RedisService>;

  beforeEach(() => {
    mockRedisService = {
      isHealthy: jest.fn<() => Promise<boolean>>(),
    } as unknown as jest.Mocked<RedisService>;

    service = new HealthService(mockRedisService);
  });

  it('should return ok when Redis is connected', async () => {
    mockRedisService.isHealthy.mockResolvedValue(true);

    const result = await service.checkHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('courtly-api');
    expect(result.dependencies.redis).toBe('connected');
    expect(result.timestamp).toBeDefined();
  });

  it('should return degraded when Redis is disconnected', async () => {
    mockRedisService.isHealthy.mockResolvedValue(false);

    const result = await service.checkHealth();
    expect(result.status).toBe('degraded');
    expect(result.service).toBe('courtly-api');
    expect(result.dependencies.redis).toBe('disconnected');
    expect(result.timestamp).toBeDefined();
  });
});
