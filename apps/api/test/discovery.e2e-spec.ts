import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CourtStatus, Prisma, Role, Sport, UserStatus, VenueStatus } from '@prisma/client';
import argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Phase 4 Public Venue Discovery, Geo Haversine, Map & Caching (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ts = Date.now();
  const ownerEmail = `disc_owner_${ts}@courtly.app`;
  const adminEmail = `disc_admin_${ts}@courtly.app`;
  const password = 'Password123!';

  let ownerId: string;
  let adminId: string;
  let ownerToken: string;
  let adminToken: string;

  let venueNearId: string;
  let venueFarId: string;
  let venueNoCoordsId: string;
  let venueDraftId: string;

  let parkingAmenityId: string;
  let floodlightsAmenityId: string;

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

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const [owner, admin] = await Promise.all([
      prisma.user.create({
        data: {
          email: ownerEmail,
          fullName: 'Discovery Owner',
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
          roles: { create: [{ role: Role.PLAYER }, { role: Role.VENUE_OWNER }] },
          profile: { create: { preferredSports: [] } },
        },
      }),
      prisma.user.create({
        data: {
          email: adminEmail,
          fullName: 'Discovery Admin',
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
          roles: { create: [{ role: Role.PLAYER }, { role: Role.ADMIN }] },
          profile: { create: { preferredSports: [] } },
        },
      }),
    ]);

    ownerId = owner.id;
    adminId = admin.id;

    const ownerLogin = await (request as any)(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: ownerEmail, password })
      .expect(200);
    ownerToken = ownerLogin.body.accessToken;

    const adminLogin = await (request as any)(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    const amenities = await prisma.amenity.findMany({
      where: { slug: { in: ['parking', 'floodlights'] } },
    });
    parkingAmenityId = amenities.find((a) => a.slug === 'parking')!.id;
    floodlightsAmenityId = amenities.find((a) => a.slug === 'floodlights')!.id;

    const uniqueCity = `TestCity${ts}`;

    // 1. Approved Near Venue (Gurugram center ~0.5 km away, indoor Badminton 400 INR + outdoor Football 1200 INR)
    const vNear = await prisma.venue.create({
      data: {
        ownerId,
        name: `Alpha Turf ${ts}`,
        slug: `alpha-turf-${ts}`,
        description: 'Top indoor badminton and outdoor football venue',
        businessContactPhone: '+919900000001',
        businessContactEmail: 'alpha@venue.test',
        addressLine1: 'Sector 45',
        locality: 'Sector 45',
        city: uniqueCity,
        state: 'Haryana',
        postalCode: '122003',
        country: 'India',
        latitude: new Prisma.Decimal('28.460000'),
        longitude: new Prisma.Decimal('77.027000'),
        currency: 'INR',
        status: VenueStatus.APPROVED,
        publishedAt: new Date(Date.now() - 10000),
        courts: {
          create: [
            {
              name: 'Badminton Indoor 1',
              sport: Sport.BADMINTON,
              indoor: true,
              maxPlayers: 4,
              basePricePerHour: new Prisma.Decimal('400.00'),
              currency: 'INR',
              status: CourtStatus.ACTIVE,
            },
            {
              name: 'Football Turf 1',
              sport: Sport.FOOTBALL,
              indoor: false,
              maxPlayers: 10,
              basePricePerHour: new Prisma.Decimal('1200.00'),
              currency: 'INR',
              status: CourtStatus.ACTIVE,
            },
            {
              name: 'Inactive Cheap Court',
              sport: Sport.CRICKET,
              indoor: false,
              maxPlayers: 12,
              basePricePerHour: new Prisma.Decimal('50.00'),
              currency: 'INR',
              status: CourtStatus.INACTIVE,
            },
          ],
        },
        amenities: {
          create: [
            { amenityId: parkingAmenityId },
            { amenityId: floodlightsAmenityId },
          ],
        },
        images: {
          create: {
            publicId: `courtly/venues/${ownerId}/near_${ts}`,
            secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/near.jpg',
            width: 1200,
            height: 800,
            format: 'jpg',
            bytes: 150000,
            position: 0,
            isCover: true,
          },
        },
      },
    });
    venueNearId = vNear.id;

    // 2. Approved Far Venue (~8 km away, outdoor Football 900 INR, parking only)
    const vFar = await prisma.venue.create({
      data: {
        ownerId,
        name: `Beta Arena ${ts}`,
        slug: `beta-arena-${ts}`,
        description: 'Spacious outdoor football ground',
        businessContactPhone: '+919900000002',
        businessContactEmail: 'beta@venue.test',
        addressLine1: 'Golf Course Road',
        locality: 'DLF Phase 5',
        city: uniqueCity,
        state: 'Haryana',
        postalCode: '122009',
        country: 'India',
        latitude: new Prisma.Decimal('28.530000'),
        longitude: new Prisma.Decimal('77.080000'),
        currency: 'INR',
        status: VenueStatus.APPROVED,
        publishedAt: new Date(),
        courts: {
          create: {
            name: '7v7 Ground',
            sport: Sport.FOOTBALL,
            indoor: false,
            maxPlayers: 14,
            basePricePerHour: new Prisma.Decimal('900.00'),
            currency: 'INR',
            status: CourtStatus.ACTIVE,
          },
        },
        amenities: {
          create: [{ amenityId: parkingAmenityId }],
        },
      },
    });
    venueFarId = vFar.id;

    // 3. Approved Venue WITHOUT coordinates (should appear in city list search, NOT on map!)
    const vNoCoords = await prisma.venue.create({
      data: {
        ownerId,
        name: `Gamma Unmapped ${ts}`,
        slug: `gamma-unmapped-${ts}`,
        description: 'City-searchable venue without GPS coordinates',
        businessContactPhone: '+919900000003',
        businessContactEmail: 'gamma@venue.test',
        addressLine1: 'MG Road',
        locality: 'Central',
        city: uniqueCity,
        state: 'Haryana',
        postalCode: '122001',
        country: 'India',
        latitude: null,
        longitude: null,
        currency: 'INR',
        status: VenueStatus.APPROVED,
        publishedAt: new Date(Date.now() - 20000),
        courts: {
          create: {
            name: 'Padel Court 1',
            sport: Sport.PADEL,
            indoor: true,
            maxPlayers: 4,
            basePricePerHour: new Prisma.Decimal('1500.00'),
            currency: 'INR',
            status: CourtStatus.ACTIVE,
          },
        },
      },
    });
    venueNoCoordsId = vNoCoords.id;

    // 4. Draft Venue (must NEVER appear in public search or map!)
    const vDraft = await prisma.venue.create({
      data: {
        ownerId,
        name: `Hidden Draft ${ts}`,
        slug: `hidden-draft-${ts}`,
        description: 'Should never be visible publicly',
        city: uniqueCity,
        state: 'Haryana',
        latitude: new Prisma.Decimal('28.461000'),
        longitude: new Prisma.Decimal('77.028000'),
        status: VenueStatus.DRAFT,
        courts: {
          create: {
            name: 'Draft Turf',
            sport: Sport.FOOTBALL,
            maxPlayers: 10,
            basePricePerHour: new Prisma.Decimal('300.00'),
            currency: 'INR',
            status: CourtStatus.ACTIVE,
          },
        },
      },
    });
    venueDraftId = vDraft.id;
  }, 45000);

  afterAll(async () => {
    if (prisma) {
      try {
        await prisma.venue.deleteMany({
          where: {
            id: { in: [venueNearId, venueFarId, venueNoCoordsId, venueDraftId].filter(Boolean) },
          },
        });
        await prisma.adminAuditLog.deleteMany({
          where: { actorId: { in: [adminId, ownerId].filter(Boolean) } },
        });
        await prisma.user.deleteMany({
          where: { email: { in: [ownerEmail, adminEmail] } },
        });
      } catch {
        // Ignore cleanup errors
      }
    }
    if (app) await app.close();
  }, 20000);

  it('1. Search, filters (city, sport, indoor, price, amenities AND), sorting & pagination return exact records without duplicates', async () => {
    const city = `TestCity${ts}`;

    // City search returns all 3 approved venues (excludes DRAFT), ordered NEWEST first
    const allRes = await (request as any)(app.getHttpServer())
      .get(`/api/venues?city=${city}&sort=NEWEST&page=1&pageSize=2`)
      .expect(200);

    expect(allRes.body.meta.total).toBe(3);
    expect(allRes.body.meta.totalPages).toBe(2);
    expect(allRes.body.data).toHaveLength(2);
    expect(allRes.body.data.map((v: any) => v.id)).not.toContain(venueDraftId);

    // Page 2 returns the 3rd unique venue with zero duplicates
    const page2 = await (request as any)(app.getHttpServer())
      .get(`/api/venues?city=${city}&sort=NEWEST&page=2&pageSize=2`)
      .expect(200);

    expect(page2.body.data).toHaveLength(1);
    const allIds = [
      ...allRes.body.data.map((v: any) => v.id),
      ...page2.body.data.map((v: any) => v.id),
    ];
    expect(new Set(allIds).size).toBe(3);

    // Combined filter: indoor=true + sport=BADMINTON + price 200..600 + amenities AND (parking + floodlights)
    const filtered = await (request as any)(app.getHttpServer())
      .get(
        `/api/venues?city=${city}&sport=BADMINTON&indoor=true&minPrice=200&maxPrice=600&amenityIds=${parkingAmenityId},${floodlightsAmenityId}`,
      )
      .expect(200);

    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].id).toBe(venueNearId);
    // Starting price must be 400.00 (ignoring the 50.00 INACTIVE court!)
    expect(filtered.body.data[0].startingPricePerHour).toBe('400.00');
    expect(filtered.body.data[0].activeCourtCount).toBe(2);

    // Price sorting LOW_TO_HIGH: Alpha (400) -> Beta (900) -> Gamma (1500)
    const priceAsc = await (request as any)(app.getHttpServer())
      .get(`/api/venues?city=${city}&sort=PRICE_LOW_TO_HIGH`)
      .expect(200);
    expect(priceAsc.body.data.map((v: any) => v.id)).toEqual([
      venueNearId,
      venueFarId,
      venueNoCoordsId,
    ]);
  }, 25000);

  it('2. Nearby Haversine search sorts accurately by DISTANCE and excludes unmapped/out-of-radius venues', async () => {
    const city = `TestCity${ts}`;

    const nearby = await (request as any)(app.getHttpServer())
      .get(
        `/api/venues?city=${city}&latitude=28.4595&longitude=77.0266&radiusKm=15&sort=DISTANCE`,
      )
      .expect(200);

    expect(nearby.body.data.map((v: any) => v.id)).toEqual([
      venueNearId,
      venueFarId,
    ]);
    expect(nearby.body.data[0].distanceKm).toBeLessThan(1);
    expect(nearby.body.data[1].distanceKm).toBeGreaterThan(5);
    expect(nearby.body.data[0].distanceKm).toBeLessThan(
      nearby.body.data[1].distanceKm,
    );

    // Tight 2 km radius returns only venueNearId
    const tight = await (request as any)(app.getHttpServer())
      .get(
        `/api/venues?city=${city}&latitude=28.4595&longitude=77.0266&radiusKm=2&sort=DISTANCE`,
      )
      .expect(200);
    expect(tight.body.data.map((v: any) => v.id)).toEqual([venueNearId]);
  }, 20000);

  it('3. Compact Map API returns only approved venues with valid coordinates inside bounds', async () => {
    const city = `TestCity${ts}`;

    const mapRes = await (request as any)(app.getHttpServer())
      .get(
        `/api/venues/map?north=28.60&south=28.40&east=77.15&west=76.95&city=${city}`,
      )
      .expect(200);

    const markerIds = mapRes.body.markers.map((m: any) => m.id);
    expect(markerIds).toContain(venueNearId);
    expect(markerIds).toContain(venueFarId);
    expect(markerIds).not.toContain(venueNoCoordsId);
    expect(markerIds).not.toContain(venueDraftId);
    expect(mapRes.body.hasMore).toBe(false);
  }, 20000);

  it('4. Public venue details hide private owner/admin fields and Redis cache invalidates when venue is paused', async () => {
    const detail = await (request as any)(app.getHttpServer())
      .get(`/api/venues/${venueNearId}`)
      .expect(200);

    expect(detail.body.venue.name).toBe(`Alpha Turf ${ts}`);
    expect(detail.body.venue.startingPricePerHour).toBe('400.00');
    expect(detail.body.venue.rejectionReason).toBeUndefined();
    expect(detail.body.venue.ownerId).toBeUndefined();
    expect(detail.body.venue.reviewedById).toBeUndefined();

    // Owner updates coordinates on previously unmapped venue via PATCH /api/owner/venues/:venueId/location
    const locRes = await (request as any)(app.getHttpServer())
      .patch(`/api/owner/venues/${venueNoCoordsId}/location`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ latitude: 28.4700, longitude: 77.0300 })
      .expect(200);
    expect(locRes.body.venue.latitude).toBeCloseTo(28.47, 4);

    // Admin pauses venueNearId -> cache invalidates immediately and public endpoint returns 404 (not stale!)
    await (request as any)(app.getHttpServer())
      .patch(`/api/admin/venues/${venueNearId}/pause`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Maintenance check' })
      .expect(200);

    await (request as any)(app.getHttpServer())
      .get(`/api/venues/${venueNearId}`)
      .expect(404);
  }, 25000);
});
