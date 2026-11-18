import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from '@courtly/shared';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(private readonly redisService: RedisService) {}

  async checkHealth(): Promise<HealthResponseDto> {
    const isRedisHealthy = await this.redisService.isHealthy();
    const redisStatus: 'connected' | 'disconnected' = isRedisHealthy
      ? 'connected'
      : 'disconnected';

    const status: 'ok' | 'degraded' = isRedisHealthy ? 'ok' : 'degraded';

    return {
      status,
      service: 'courtly-api',
      dependencies: {
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
