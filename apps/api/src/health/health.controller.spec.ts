import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockHealthService: jest.Mocked<HealthService>;

  beforeEach(() => {
    mockHealthService = {
      checkHealth: jest.fn<() => Promise<any>>().mockResolvedValue({
        status: 'ok',
        service: 'courtly-api',
        dependencies: {
          redis: 'connected',
        },
        timestamp: '2026-11-15T00:00:00.000Z',
      }),
    } as unknown as jest.Mocked<HealthService>;

    controller = new HealthController(mockHealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', async () => {
    const result = await controller.getHealth();
    expect(result.service).toBe('courtly-api');
    expect(result.status).toBe('ok');
    expect(result.dependencies.redis).toBe('connected');
    expect(mockHealthService.checkHealth).toHaveBeenCalledTimes(1);
  });
});
