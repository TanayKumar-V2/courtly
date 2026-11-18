import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Role, UserStatus } from '@prisma/client';
import argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service.js';

describe('Phase 3 Venue Management & Moderation (E2E / Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cloudinaryService: CloudinaryService;

  const ts = Date.now();
  const ownerAEmail = `owner_a_${ts}@courtly.app`;
  const ownerBEmail = `owner_b_${ts}@courtly.app`;
  const adminEmail = `admin_${ts}@courtly.app`;
  const password = 'Password123!';

  let ownerAId: string;
  let ownerBId: string;
  let adminId: string;

  let ownerAToken: string;
  let ownerBToken: string;
  let adminToken: string;

  let applicationId: string;
  let venueId: string;
  let courtId: string;
  let imageId: string;
  let amenityIds: string[] = [];

  async function createVerifiedUser(email: string, fullName: string, roles: Role[]) {
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    return prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        roles: { create: roles.map((role) => ({ role })) },
        profile: { create: { preferredSports: [] } },
      },
    });
  }

  async function loginAs(email: string): Promise<string> {
    const res = await (request as any)(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    return res.body.accessToken;
  }

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
    cloudinaryService = app.get(CloudinaryService);

    const [ownerA, ownerB, admin] = await Promise.all([
      createVerifiedUser(ownerAEmail, 'Owner Alpha', [Role.PLAYER]),
      createVerifiedUser(ownerBEmail, 'Owner Beta', [Role.PLAYER, Role.VENUE_OWNER]),
      createVerifiedUser(adminEmail, 'Courtly Admin', [Role.PLAYER, Role.ADMIN]),
    ]);

    ownerAId = ownerA.id;
    ownerBId = ownerB.id;
    adminId = admin.id;

    [ownerAToken, ownerBToken, adminToken] = await Promise.all([
      loginAs(ownerAEmail),
      loginAs(ownerBEmail),
      loginAs(adminEmail),
    ]);
  }, 40000);

  afterAll(async () => {
    if (prisma) {
      try {
        if (venueId) {
          await prisma.venue.deleteMany({ where: { id: venueId } });
        }
        await prisma.adminAuditLog.deleteMany({
          where: { actorId: { in: [adminId, ownerAId, ownerBId].filter(Boolean) } },
        });
        await prisma.ownerApplication.deleteMany({
          where: { userId: { in: [ownerAId, ownerBId, adminId].filter(Boolean) } },
        });
        await prisma.user.deleteMany({
          where: { email: { in: [ownerAEmail, ownerBEmail, adminEmail] } },
        });
      } catch {
        // Ignore cleanup errors
      }
    }
    if (app) {
      await app.close();
    }
  }, 20000);

  it('1. PLAYER cannot create venues before VENUE_OWNER approval (403)', async () => {
    await (request as any)(app.getHttpServer())
      .post('/api/owner/venues')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({ name: 'Unauthorized Turf' })
      .expect(403);
  }, 15000);

  it('2. Verified PLAYER submits owner application, duplicate pending is rejected, and non-admin cannot approve', async () => {
    const res = await (request as any)(app.getHttpServer())
      .post('/api/owner-applications')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        businessName: 'Velocity Sports Arena',
        businessType: 'Multi-Sport Complex',
        contactPerson: 'Owner Alpha',
        contactPhone: '+919876543210',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        additionalInformation: '2 football turfs and 2 badminton courts',
      })
      .expect(201);

    applicationId = res.body.application.id;
    expect(res.body.application.status).toBe('PENDING');

    // Duplicate pending application blocked
    await (request as any)(app.getHttpServer())
      .post('/api/owner-applications')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        businessName: 'Duplicate Arena',
        businessType: 'Turf',
        contactPerson: 'Owner Alpha',
        contactPhone: '+919876543210',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
      })
      .expect(409);

    // Non-admin cannot approve application
    await (request as any)(app.getHttpServer())
      .patch(`/api/admin/owner-applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .expect(403);
  }, 20000);

  it('3. ADMIN approves owner application atomically and grants VENUE_OWNER role', async () => {
    const res = await (request as any)(app.getHttpServer())
      .patch(`/api/admin/owner-applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.application.status).toBe('APPROVED');

    // Duplicate approval rejected
    await (request as any)(app.getHttpServer())
      .patch(`/api/admin/owner-applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);

    // Verify audit log persisted
    const audit = await prisma.adminAuditLog.findFirst({
      where: {
        entityType: 'OWNER_APPLICATION',
        entityId: applicationId,
        action: 'APPROVE',
      },
    });
    expect(audit).toBeTruthy();

    // Refresh session / re-login to verify updated role permissions
    ownerAToken = await loginAs(ownerAEmail);
  }, 20000);

  it('4. Owner A creates venue draft, validates coordinates, adds court with Decimal price, and associates amenities', async () => {
    // Reject invalid coordinates
    await (request as any)(app.getHttpServer())
      .post('/api/owner/venues')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({ name: 'Bad Coords', latitude: 120, longitude: 77 })
      .expect(400);

    const venueRes = await (request as any)(app.getHttpServer())
      .post('/api/owner/venues')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: `Velocity Sports Arena ${ts}`,
        description: 'Floodlit artificial turf and indoor wooden badminton courts.',
        businessContactPhone: '+919876543210',
        businessContactEmail: 'bookings@velocityarena.in',
        addressLine1: '42 100 Feet Road',
        locality: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
        latitude: 12.971599,
        longitude: 77.594563,
        currency: 'INR',
      })
      .expect(201);

    venueId = venueRes.body.venue.id;
    expect(venueRes.body.venue.status).toBe('DRAFT');

    // Reject negative court price
    await (request as any)(app.getHttpServer())
      .post(`/api/owner/venues/${venueId}/courts`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: 'Bad Court',
        sport: 'FOOTBALL',
        maxPlayers: 10,
        basePricePerHour: -500,
      })
      .expect(400);

    // Create valid court
    const courtRes = await (request as any)(app.getHttpServer())
      .post(`/api/owner/venues/${venueId}/courts`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: 'Turf Pitch 1',
        sport: 'FOOTBALL',
        surfaceType: 'FIFA Pro Artificial Turf',
        indoor: false,
        maxPlayers: 10,
        basePricePerHour: 1600,
        currency: 'INR',
      })
      .expect(201);

    courtId = courtRes.body.court.id;
    expect(courtRes.body.court.basePricePerHour).toBe(1600);

    // Fetch seeded amenities
    const amRes = await (request as any)(app.getHttpServer())
      .get('/api/amenities')
      .expect(200);
    expect(amRes.body.amenities.length).toBeGreaterThanOrEqual(12);
    amenityIds = amRes.body.amenities.slice(0, 3).map((a: any) => a.id);

    // Attach amenities
    const putAmRes = await (request as any)(app.getHttpServer())
      .put(`/api/owner/venues/${venueId}/amenities`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({ amenityIds })
      .expect(200);
    expect(putAmRes.body.amenities).toHaveLength(3);
  }, 25000);

  it('5. Image verification rejects arbitrary URLs and persists only verified Cloudinary assets', async () => {
    const expectedPublicId = `courtly/venues/${ownerAId}/${venueId}/img_verified_e2e`;

    // Spy on verifyUploadedAsset so E2E verifies folder/URL security without live external Cloudinary upload
    const verifySpy = jest
      .spyOn(cloudinaryService, 'verifyUploadedAsset')
      .mockImplementation(async (pubId, owner, venue) => {
        if (!pubId.startsWith(`courtly/venues/${owner}/${venue}/`)) {
          throw new BadRequestException('Invalid asset scope');
        }
        return {
          publicId: pubId,
          secureUrl: `https://res.cloudinary.com/demo/image/upload/v1/${pubId}.jpg`,
          width: 1600,
          height: 900,
          format: 'jpg',
          bytes: 350000,
        };
      });

    // Reject arbitrary external URL
    await (request as any)(app.getHttpServer())
      .post(`/api/owner/venues/${venueId}/images`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({ publicId: 'https://arbitrary-host.example/fake.jpg' })
      .expect(400);

    // Persist verified Cloudinary asset
    const imgRes = await (request as any)(app.getHttpServer())
      .post(`/api/owner/venues/${venueId}/images`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({ publicId: expectedPublicId })
      .expect(201);

    imageId = imgRes.body.image.id;
    expect(imgRes.body.image.isCover).toBe(true);
    expect(imgRes.body.image.publicId).toBe(expectedPublicId);

    verifySpy.mockRestore();
  }, 20000);

  it('6. Owner isolation: Owner B cannot access, edit, add courts, or delete images on Owner A venue', async () => {
    await (request as any)(app.getHttpServer())
      .get(`/api/owner/venues/${venueId}`)
      .set('Authorization', `Bearer ${ownerBToken}`)
      .expect(403);

    await (request as any)(app.getHttpServer())
      .patch(`/api/owner/venues/${venueId}`)
      .set('Authorization', `Bearer ${ownerBToken}`)
      .send({ name: 'Hijacked' })
      .expect(403);

    await (request as any)(app.getHttpServer())
      .post(`/api/owner/venues/${venueId}/courts`)
      .set('Authorization', `Bearer ${ownerBToken}`)
      .send({
        name: 'Rogue Court',
        sport: 'TENNIS',
        maxPlayers: 4,
        basePricePerHour: 900,
      })
      .expect(403);

    await (request as any)(app.getHttpServer())
      .delete(`/api/owner/venues/${venueId}/images/${imageId}`)
      .set('Authorization', `Bearer ${ownerBToken}`)
      .expect(403);
  }, 20000);

  it('7. Draft/Pending/Rejected/Paused venues are hidden publicly; Admin approval publishes venue', async () => {
    // Draft is NOT publicly accessible
    await (request as any)(app.getHttpServer())
      .get(`/api/venues/${venueId}`)
      .expect(404);

    // Submit for review
    const submitRes = await (request as any)(app.getHttpServer())
      .patch(`/api/owner/venues/${venueId}/submit`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .expect(200);
    expect(submitRes.body.venue.status).toBe('PENDING_REVIEW');

    // Pending is NOT publicly accessible
    await (request as any)(app.getHttpServer())
      .get(`/api/venues/${venueId}`)
      .expect(404);

    // Owner cannot approve their own listing
    await (request as any)(app.getHttpServer())
      .patch(`/api/admin/venues/${venueId}/approve`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .expect(403);

    // Admin rejects with reason -> REJECTED (still hidden publicly)
    await (request as any)(app.getHttpServer())
      .patch(`/api/admin/venues/${venueId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Please add clearer signage description' })
      .expect(200);

    await (request as any)(app.getHttpServer())
      .get(`/api/venues/${venueId}`)
      .expect(404);

    // Owner edits rejected listing and resubmits
    await (request as any)(app.getHttpServer())
      .patch(`/api/owner/venues/${venueId}`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({ description: 'Updated with clear entry signage details.' })
      .expect(200);

    await (request as any)(app.getHttpServer())
      .patch(`/api/owner/venues/${venueId}/submit`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .expect(200);

    // Admin approves -> APPROVED
    const approveRes = await (request as any)(app.getHttpServer())
      .patch(`/api/admin/venues/${venueId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(approveRes.body.venue.status).toBe('APPROVED');

    // Public endpoints now return APPROVED venue without internal fields
    const pubDetail = await (request as any)(app.getHttpServer())
      .get(`/api/venues/${venueId}`)
      .expect(200);
    expect(pubDetail.body.venue.id).toBe(venueId);
    expect(pubDetail.body.venue.courts).toHaveLength(1);
    expect(pubDetail.body.venue.rejectionReason).toBeUndefined();
    expect(pubDetail.body.venue.ownerId).toBeUndefined();

    const pubList = await (request as any)(app.getHttpServer())
      .get('/api/venues?city=Bengaluru&sport=FOOTBALL&minPrice=1000&maxPrice=2000')
      .expect(200);
    expect(pubList.body.data.some((v: any) => v.id === venueId)).toBe(true);

    const pubCourts = await (request as any)(app.getHttpServer())
      .get(`/api/venues/${venueId}/courts`)
      .expect(200);
    expect(pubCourts.body.courts[0].id).toBe(courtId);

    // Admin pauses venue -> immediately hidden from public
    await (request as any)(app.getHttpServer())
      .patch(`/api/admin/venues/${venueId}/pause`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Scheduled turf resurfacing' })
      .expect(200);

    await (request as any)(app.getHttpServer())
      .get(`/api/venues/${venueId}`)
      .expect(404);
  }, 35000);
});
