import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { CourtStatus, Sport, VenueStatus } from '@prisma/client';
import { VenuesService } from './venues.service.js';
import { VenueCacheService } from './venue-cache.service.js';
import { VenueSortOption } from './dto/query-public-venues.dto.js';
import { computeBoundingBox, haversineDistanceKm } from './geo-utils.js';

const mockFn = (): any => jest.fn();

describe('Phase 4 Venue Discovery, Geo & Redis Cache Unit Tests', () => {
  describe('Geo Utilities (Haversine & Bounding Box)', () => {
    it('calculates accurate Haversine distance in km (Gurugram to Connaught Place, Delhi ~28-30 km)', () => {
      const dist = haversineDistanceKm(28.4595, 77.0266, 28.6315, 77.2167);
      expect(dist).toBeGreaterThan(25);
      expect(dist).toBeLessThan(31);
    });

    it('returns 0 km for identical coordinates', () => {
      expect(haversineDistanceKm(12.9716, 77.5946, 12.9716, 77.5946)).toBe(0);
    });

    it('computes valid bounding box and handles antimeridian crossing cleanly', () => {
      const normal = computeBoundingBox(28.4595, 77.0266, 10);
      expect(normal.crossesAntimeridian).toBe(false);
      expect(normal.minLat).toBeLessThan(28.4595);
      expect(normal.maxLat).toBeGreaterThan(28.4595);

      const antimeridian = computeBoundingBox(0, 179.95, 25);
      expect(antimeridian.crossesAntimeridian).toBe(true);
    });
  });

  describe('VenueCacheService (Key Canonicalization, Fallback & Invalidation)', () => {
    let redisClient: any;
    let redisService: any;
    let cacheService: VenueCacheService;

    beforeEach(() => {
      redisClient = {
        get: mockFn(),
        set: mockFn(),
        incr: mockFn(),
      };
      redisService = {
        getClient: mockFn().mockReturnValue(redisClient),
      };
      cacheService = new VenueCacheService(redisService);
    });

    it('generates identical canonical cache keys regardless of key order or whitespace/casing', () => {
      const keyA = cacheService.buildCanonicalKey('2', 'search', {
        city: ' Gurugram ',
        sport: 'FOOTBALL',
        amenityIds: ['b', 'a'],
        page: 1,
      });
      const keyB = cacheService.buildCanonicalKey('2', 'search', {
        page: 1,
        amenityIds: ['a', 'b'],
        sport: 'football',
        city: 'gurugram',
      });
      expect(keyA).toBe(keyB);
    });

    it('gracefully falls back to null when Redis throws during get/set', async () => {
      redisClient.get.mockRejectedValue(new Error('ECONNREFUSED'));
      redisClient.set.mockRejectedValue(new Error('ECONNREFUSED'));

      const val = await cacheService.get('search', { city: 'Delhi' });
      expect(val).toBeNull();

      await expect(
        cacheService.set('search', { city: 'Delhi' }, { data: [] }, 60),
      ).resolves.toBeUndefined();
    });

    it('bumps version counter atomically on invalidateAll()', async () => {
      redisClient.incr.mockResolvedValue(2);
      await cacheService.invalidateAll();
      expect(redisClient.incr).toHaveBeenCalledWith(
        'courtly:venues:cache:version',
      );
    });
  });

  describe('VenuesService Discovery Validation, Filtering, Sorting & Caching', () => {
    let repo: any;
    let cache: any;
    let service: VenuesService;

    const sampleApprovedVenue = {
      id: 'v-1',
      slug: 'sector-45-arena',
      name: 'Sector 45 Turf Arena',
      description: 'FIFA turf and indoor badminton',
      locality: 'Sector 45',
      city: 'Gurugram',
      state: 'Haryana',
      country: 'India',
      addressLine1: 'Plot 14, Sector 45',
      addressLine2: null,
      postalCode: '122003',
      latitude: 28.4595,
      longitude: 77.0266,
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      status: VenueStatus.APPROVED,
      publishedAt: new Date(),
      courts: [
        {
          id: 'c-active-1',
          venueId: 'v-1',
          name: 'Turf 1',
          sport: Sport.FOOTBALL,
          indoor: false,
          maxPlayers: 10,
          basePricePerHour: 600,
          currency: 'INR',
          status: CourtStatus.ACTIVE,
        },
        {
          id: 'c-active-2',
          venueId: 'v-1',
          name: 'Badminton 1',
          sport: Sport.BADMINTON,
          indoor: true,
          maxPlayers: 4,
          basePricePerHour: 350,
          currency: 'INR',
          status: CourtStatus.ACTIVE,
        },
        {
          id: 'c-inactive',
          venueId: 'v-1',
          name: 'Closed Court',
          sport: Sport.TENNIS,
          indoor: false,
          maxPlayers: 4,
          basePricePerHour: 100,
          currency: 'INR',
          status: CourtStatus.INACTIVE,
        },
      ],
      amenities: [
        {
          amenity: {
            id: 'am-1',
            name: 'Parking',
            slug: 'parking',
            category: 'FACILITY',
            icon: 'car',
          },
        },
      ],
      images: [
        {
          id: 'img-1',
          secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/turf.jpg',
          width: 1200,
          height: 800,
          position: 0,
          isCover: true,
        },
      ],
    };

    beforeEach(() => {
      repo = {
        searchPublicApprovedVenues: mockFn(),
        findPublicMapMarkers: mockFn(),
        findPublicApprovedById: mockFn(),
      };
      cache = {
        get: mockFn().mockResolvedValue(null),
        set: mockFn().mockResolvedValue(undefined),
        invalidateAll: mockFn().mockResolvedValue(undefined),
      };
      service = new VenuesService(repo, cache);
    });

    it('passes normalized search, city, sport, price, indoor, amenities, and sort filters to repository and computes startingPricePerHour from ACTIVE courts only', async () => {
      repo.searchPublicApprovedVenues.mockResolvedValue({
        items: [sampleApprovedVenue],
        total: 1,
        distanceById: new Map([['v-1', null]]),
      });

      const res = await service.listPublicApprovedVenues({
        q: 'Turf',
        city: 'Gurugram',
        state: 'Haryana',
        sport: Sport.BADMINTON,
        minPrice: 200,
        maxPrice: 800,
        indoor: true,
        amenityIds: 'am-1,am-2',
        sort: VenueSortOption.PRICE_LOW_TO_HIGH,
        page: 1,
        pageSize: 20,
      });

      expect(repo.searchPublicApprovedVenues).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'Turf',
          city: 'Gurugram',
          state: 'Haryana',
          sport: Sport.BADMINTON,
          minPrice: 200,
          maxPrice: 800,
          indoor: true,
          amenityIds: ['am-1', 'am-2'],
          sort: VenueSortOption.PRICE_LOW_TO_HIGH,
          page: 1,
          pageSize: 20,
        }),
      );

      // Inactive court (100 INR, TENNIS) must be excluded from public price & sports!
      expect(res.data[0].startingPricePerHour).toBe('350.00');
      expect(res.data[0].sports).toEqual(['FOOTBALL', 'BADMINTON']);
      expect(res.data[0].activeCourtCount).toBe(2);
      expect(res.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
      expect(cache.set).toHaveBeenCalledTimes(1);
    });

    it('serves cached search results on Redis cache hit without hitting PostgreSQL', async () => {
      cache.get.mockResolvedValue({
        data: [],
        meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      });

      const res = await service.listPublicApprovedVenues({ page: 1 });
      expect(res.meta.total).toBe(0);
      expect(repo.searchPublicApprovedVenues).not.toHaveBeenCalled();
    });

    it('rejects DISTANCE sort without coordinates, invalid radiusKm, inverted prices, and incomplete coords', async () => {
      await expect(
        service.listPublicApprovedVenues({
          page: 1,
          sort: VenueSortOption.DISTANCE,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.listPublicApprovedVenues({
          page: 1,
          latitude: 28.45,
          longitude: 77.02,
          radiusKm: 75,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.listPublicApprovedVenues({
          page: 1,
          latitude: 28.45,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.listPublicApprovedVenues({
          page: 1,
          minPrice: 1000,
          maxPrice: 500,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('validates map bounding box (north >= south) and returns compact marker DTOs', async () => {
      await expect(
        service.getPublicMapMarkers({
          north: 20,
          south: 30,
          east: 78,
          west: 76,
        }),
      ).rejects.toThrow(BadRequestException);

      repo.findPublicMapMarkers.mockResolvedValue({
        items: [
          {
            id: 'v-1',
            slug: 'sector-45-arena',
            name: 'Sector 45 Turf Arena',
            locality: 'Sector 45',
            city: 'Gurugram',
            state: 'Haryana',
            latitude: 28.4595,
            longitude: 77.0266,
            currency: 'INR',
            images: [{ secureUrl: 'https://cdn.example/cover.jpg' }],
            courts: [{ sport: Sport.FOOTBALL, basePricePerHour: 600 }],
          },
        ],
        hasMore: false,
      });

      const mapRes = await service.getPublicMapMarkers({
        north: 29,
        south: 28,
        east: 78,
        west: 76,
      });
      expect(mapRes.count).toBe(1);
      expect(mapRes.hasMore).toBe(false);
      expect(mapRes.markers[0].startingPricePerHour).toBe('600.00');
      expect(mapRes.markers[0].coverImage?.secureUrl).toBe(
        'https://cdn.example/cover.jpg',
      );
    });
  });
});
