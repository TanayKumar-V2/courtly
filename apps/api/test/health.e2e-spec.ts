import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api/health (GET)', async () => {
    const response = await (request as unknown as (app: unknown) => request.SuperTest<request.Test>)(
      app.getHttpServer(),
    )
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('service', 'courtly-api');
    expect(response.body).toHaveProperty('status');
    expect(['ok', 'degraded']).toContain(response.body.status);
    expect(response.body).toHaveProperty('dependencies');
    expect(response.body.dependencies).toHaveProperty('redis');
    expect(response.body).toHaveProperty('timestamp');
  });
});
