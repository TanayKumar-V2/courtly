import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Authentication & User Management (E2E / Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testEmail = `test_e2e_${Date.now()}@courtly.app`;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  }, 30000);

  afterAll(async () => {
    if (prisma) {
      // Clean up test data
      try {
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        if (user) {
          await prisma.user.delete({ where: { id: user.id } });
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    if (app) {
      await app.close();
    }
  });

  it('1. POST /api/auth/register should create user in database with hashed password and verification token', async () => {
    const res = await (request as any)(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        fullName: 'Test Player',
        email: testEmail,
        password: 'Password123!',
        city: 'Bengaluru',
        preferredSports: ['FOOTBALL', 'BADMINTON'],
      })
      .expect(201);

    expect(res.body).toHaveProperty('message');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail.toLowerCase());
    expect(res.body.user).not.toHaveProperty('passwordHash');

    userId = res.body.user.id;

    // Database verification: Verify password is encrypted with Argon2id and not plaintext
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        profile: true,
        emailVerificationTokens: true,
      },
    });

    expect(dbUser).toBeDefined();
    expect(dbUser!.passwordHash).toContain('$argon2id$');
    expect(dbUser!.passwordHash).not.toBe('Password123!');
    expect(dbUser!.roles[0].role).toBe('PLAYER');
    expect(dbUser!.profile?.city).toBe('Bengaluru');

    // Verify token is hashed with SHA-256 (64 hex characters) and not plaintext
    expect(dbUser!.emailVerificationTokens.length).toBeGreaterThan(0);
    expect(dbUser!.emailVerificationTokens[0].tokenHash).toHaveLength(64);
  }, 15000);

  it('2. POST /api/auth/login should reject unverified accounts', async () => {
    await (request as any)(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!',
      })
      .expect(401);
  });

  it('3. Email verification and successful login', async () => {
    // Manually activate user for test flow
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });

    const res = await (request as any)(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!',
        deviceName: 'Integration Test Runner',
        platform: 'android',
      })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user).not.toHaveProperty('passwordHash');

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;

    // Verify refresh token in database is hashed with SHA-256 and not plaintext
    const dbTokens = await prisma.refreshToken.findMany({
      where: { session: { userId } },
    });
    expect(dbTokens.length).toBeGreaterThan(0);
    expect(dbTokens[0].tokenHash).not.toBe(refreshToken);
    expect(dbTokens[0].tokenHash).toHaveLength(64);
  }, 15000);

  it('4. POST /api/auth/refresh should rotate refresh tokens atomically', async () => {
    const res = await (request as any)(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.refreshToken).not.toBe(refreshToken);

    const oldRefreshToken = refreshToken;
    refreshToken = res.body.refreshToken;
    accessToken = res.body.accessToken;

    // 5. Test Refresh Token Reuse Detection
    // Re-using the consumed token must trigger family revocation and return 401
    await (request as any)(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefreshToken })
      .expect(401);
  }, 15000);

  it('5. PATCH /api/users/me/player-profile should persist bio, sports, and skill levels', async () => {
    // Re-login to get fresh session after reuse test
    const loginRes = await (request as any)(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!',
      })
      .expect(200);

    accessToken = loginRes.body.accessToken;

    const res = await (request as any)(app.getHttpServer())
      .patch('/api/users/me/player-profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bio: 'Striker looking for weekend turf matches.',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        preferredSports: ['FOOTBALL', 'CRICKET'],
        sportSkills: [
          { sport: 'FOOTBALL', skillLevel: 'ADVANCED' },
          { sport: 'CRICKET', skillLevel: 'INTERMEDIATE' },
        ],
      })
      .expect(200);

    expect(res.body.profile.bio).toBe('Striker looking for weekend turf matches.');
    expect(res.body.sportSkills).toHaveLength(2);
    expect(res.body.sportSkills).toEqual(
      expect.arrayContaining([
        { sport: 'FOOTBALL', skillLevel: 'ADVANCED' },
        { sport: 'CRICKET', skillLevel: 'INTERMEDIATE' },
      ]),
    );

    // Verify database persistence in Neon
    const dbProfile = await prisma.playerProfile.findUnique({
      where: { userId },
    });
    expect(dbProfile?.bio).toBe('Striker looking for weekend turf matches.');
  }, 15000);

  it('6. POST /api/auth/logout should revoke current session', async () => {
    await (request as any)(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Now protected endpoint should reject the revoked session
    await (request as any)(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  }, 15000);
});
