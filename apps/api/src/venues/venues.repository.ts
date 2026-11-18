import { Injectable } from '@nestjs/common';
import { CourtStatus, Prisma, Sport, VenueStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { VenueSortOption } from './dto/query-public-venues.dto.js';
import { computeBoundingBox, EARTH_RADIUS_KM } from './geo-utils.js';

export const VENUE_FULL_INCLUDE = {
  courts: {
    where: { status: { not: CourtStatus.ARCHIVED } },
    orderBy: { createdAt: 'asc' as const },
  },
  amenities: {
    include: { amenity: true },
    orderBy: { amenity: { name: 'asc' as const } },
  },
  images: {
    orderBy: [{ isCover: 'desc' as const }, { position: 'asc' as const }],
  },
} satisfies Prisma.VenueInclude;

export const PUBLIC_VENUE_INCLUDE = {
  courts: {
    where: { status: CourtStatus.ACTIVE },
    orderBy: { basePricePerHour: 'asc' as const },
  },
  amenities: {
    where: { amenity: { isActive: true } },
    include: { amenity: true },
    orderBy: { amenity: { name: 'asc' as const } },
  },
  images: {
    orderBy: [{ isCover: 'desc' as const }, { position: 'asc' as const }],
  },
} satisfies Prisma.VenueInclude;

export interface PublicVenueSearchFilters {
  page: number;
  pageSize: number;
  q?: string;
  city?: string;
  state?: string;
  sport?: Sport;
  amenityIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  indoor?: boolean;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sort: VenueSortOption;
}

export interface VenueMapBoundsFilters {
  north: number;
  south: number;
  east: number;
  west: number;
  q?: string;
  city?: string;
  state?: string;
  sport?: Sport;
  amenityIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  indoor?: boolean;
}

interface RawSearchRow {
  id: string;
  distance_km: number | null;
  total_count: bigint | number;
}

@Injectable()
export class VenuesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string) {
    return this.prisma.venue.findUnique({ where: { slug } });
  }

  async create(data: Prisma.VenueCreateInput) {
    return this.prisma.venue.create({
      data,
      include: VENUE_FULL_INCLUDE,
    });
  }

  async findManyByOwner(ownerId: string, status?: VenueStatus) {
    return this.prisma.venue.findMany({
      where: {
        ownerId,
        archivedAt: null,
        ...(status ? { status } : {}),
      },
      include: VENUE_FULL_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByIdForOwner(venueId: string) {
    return this.prisma.venue.findFirst({
      where: {
        id: venueId,
        archivedAt: null,
      },
      include: VENUE_FULL_INCLUDE,
    });
  }

  async update(venueId: string, data: Prisma.VenueUpdateInput) {
    return this.prisma.venue.update({
      where: { id: venueId },
      data,
      include: VENUE_FULL_INCLUDE,
    });
  }

  async deleteHard(venueId: string) {
    return this.prisma.venue.delete({
      where: { id: venueId },
    });
  }

  async archiveSoft(venueId: string) {
    return this.prisma.venue.update({
      where: { id: venueId },
      data: {
        archivedAt: new Date(),
        status: VenueStatus.PAUSED,
      },
    });
  }

  /**
   * Parameterized PostgreSQL search with:
   * - Bounding box + exact Haversine distance when coordinates are supplied
   * - Active-court SQL price aggregation for accurate cross-page price sorting
   * - Strict AND semantics for amenityIds
   * - Zero unsafe string interpolation (all values bound via Prisma.sql)
   */
  async searchPublicApprovedVenues(filters: PublicVenueSearchFilters) {
    const hasCoords =
      filters.latitude !== undefined && filters.longitude !== undefined;
    const radiusKm = hasCoords ? (filters.radiusKm ?? 10) : undefined;
    const offset = (filters.page - 1) * filters.pageSize;

    const whereClauses: Prisma.Sql[] = [
      Prisma.sql`v."status" = 'APPROVED'::"VenueStatus"`,
      Prisma.sql`v."archivedAt" IS NULL`,
      // Only venues with at least one ACTIVE court contribute to public discovery
      Prisma.sql`EXISTS (
        SELECT 1 FROM "courts" c_any
        WHERE c_any."venueId" = v."id" AND c_any."status" = 'ACTIVE'::"CourtStatus"
      )`,
    ];

    if (filters.q) {
      const pattern = `%${filters.q.trim()}%`;
      whereClauses.push(
        Prisma.sql`(
          v."name" ILIKE ${pattern}
          OR v."description" ILIKE ${pattern}
          OR v."locality" ILIKE ${pattern}
          OR v."city" ILIKE ${pattern}
          OR v."state" ILIKE ${pattern}
        )`,
      );
    }

    if (filters.city) {
      whereClauses.push(
        Prisma.sql`LOWER(TRIM(v."city")) = LOWER(${filters.city.trim()})`,
      );
    }

    if (filters.state) {
      whereClauses.push(
        Prisma.sql`LOWER(TRIM(v."state")) = LOWER(${filters.state.trim()})`,
      );
    }

    // Active court filter conditions (sport, price range, indoor/outdoor)
    const courtSubClauses: Prisma.Sql[] = [
      Prisma.sql`c."venueId" = v."id"`,
      Prisma.sql`c."status" = 'ACTIVE'::"CourtStatus"`,
    ];
    let hasSpecificCourtFilter = false;

    if (filters.sport) {
      courtSubClauses.push(Prisma.sql`c."sport" = ${filters.sport}::"Sport"`);
      hasSpecificCourtFilter = true;
    }

    if (filters.minPrice !== undefined) {
      courtSubClauses.push(
        Prisma.sql`c."basePricePerHour" >= ${new Prisma.Decimal(filters.minPrice.toFixed(2))}`,
      );
      hasSpecificCourtFilter = true;
    }

    if (filters.maxPrice !== undefined) {
      courtSubClauses.push(
        Prisma.sql`c."basePricePerHour" <= ${new Prisma.Decimal(filters.maxPrice.toFixed(2))}`,
      );
      hasSpecificCourtFilter = true;
    }

    if (filters.indoor !== undefined) {
      courtSubClauses.push(Prisma.sql`c."indoor" = ${filters.indoor}`);
      hasSpecificCourtFilter = true;
    }

    if (hasSpecificCourtFilter) {
      whereClauses.push(
        Prisma.sql`EXISTS (SELECT 1 FROM "courts" c WHERE ${Prisma.join(courtSubClauses, ' AND ')})`,
      );
    }

    // AND semantics for amenity filters: venue must have EVERY selected active amenity
    if (filters.amenityIds && filters.amenityIds.length > 0) {
      for (const token of filters.amenityIds) {
        whereClauses.push(
          Prisma.sql`EXISTS (
            SELECT 1 FROM "venue_amenities" va
            INNER JOIN "amenities" a ON a."id" = va."amenityId"
            WHERE va."venueId" = v."id"
              AND a."isActive" = true
              AND (a."id" = ${token} OR LOWER(a."slug") = LOWER(${token}))
          )`,
        );
      }
    }

    // Bounding-box pre-filter + exact Haversine radius filter when coordinates supplied
    let distanceSelectSql = Prisma.sql`NULL::double precision AS distance_km`;
    if (hasCoords) {
      const lat = filters.latitude!;
      const lng = filters.longitude!;
      const bbox = computeBoundingBox(lat, lng, radiusKm!);

      whereClauses.push(
        Prisma.sql`v."latitude" IS NOT NULL AND v."longitude" IS NOT NULL`,
      );
      whereClauses.push(
        Prisma.sql`v."latitude" BETWEEN ${new Prisma.Decimal(bbox.minLat.toFixed(6))} AND ${new Prisma.Decimal(bbox.maxLat.toFixed(6))}`,
      );

      if (bbox.crossesAntimeridian) {
        whereClauses.push(
          Prisma.sql`(v."longitude" >= ${new Prisma.Decimal(bbox.minLng.toFixed(6))} OR v."longitude" <= ${new Prisma.Decimal(bbox.maxLng.toFixed(6))})`,
        );
      } else {
        whereClauses.push(
          Prisma.sql`v."longitude" BETWEEN ${new Prisma.Decimal(bbox.minLng.toFixed(6))} AND ${new Prisma.Decimal(bbox.maxLng.toFixed(6))}`,
        );
      }

      const haversineExpr = Prisma.sql`(
        ${EARTH_RADIUS_KM}::double precision * 2.0 * ASIN(
          SQRT(
            LEAST(
              1.0::double precision,
              POWER(SIN(RADIANS(v."latitude"::double precision - ${lat}::double precision) / 2.0), 2)
              + COS(RADIANS(${lat}::double precision))
                * COS(RADIANS(v."latitude"::double precision))
                * POWER(SIN(RADIANS(v."longitude"::double precision - ${lng}::double precision) / 2.0), 2)
            )
          )
        )
      )`;

      distanceSelectSql = Prisma.sql`${haversineExpr} AS distance_km`;
      whereClauses.push(Prisma.sql`${haversineExpr} <= ${radiusKm!}::double precision`);
    }

    let orderBySql: Prisma.Sql;
    switch (filters.sort) {
      case VenueSortOption.DISTANCE:
        orderBySql = Prisma.sql`ORDER BY fv.distance_km ASC NULLS LAST, fv."publishedAt" DESC NULLS LAST, fv."id" ASC`;
        break;
      case VenueSortOption.PRICE_LOW_TO_HIGH:
        orderBySql = Prisma.sql`ORDER BY fv.min_active_price ASC NULLS LAST, fv."publishedAt" DESC NULLS LAST, fv."id" ASC`;
        break;
      case VenueSortOption.PRICE_HIGH_TO_LOW:
        orderBySql = Prisma.sql`ORDER BY fv.min_active_price DESC NULLS LAST, fv."publishedAt" DESC NULLS LAST, fv."id" ASC`;
        break;
      case VenueSortOption.NEWEST:
      default:
        orderBySql = Prisma.sql`ORDER BY fv."publishedAt" DESC NULLS LAST, fv."createdAt" DESC, fv."id" ASC`;
        break;
    }

    const rows = await this.prisma.$queryRaw<RawSearchRow[]>(Prisma.sql`
      WITH filtered_venues AS (
        SELECT
          v."id",
          v."publishedAt",
          v."createdAt",
          ${distanceSelectSql},
          (
            SELECT MIN(c_p."basePricePerHour")
            FROM "courts" c_p
            WHERE c_p."venueId" = v."id" AND c_p."status" = 'ACTIVE'::"CourtStatus"
          ) AS min_active_price
        FROM "venues" v
        WHERE ${Prisma.join(whereClauses, ' AND ')}
      )
      SELECT
        fv."id",
        fv.distance_km,
        COUNT(*) OVER() AS total_count
      FROM filtered_venues fv
      ${orderBySql}
      LIMIT ${filters.pageSize}
      OFFSET ${offset}
    `);

    if (rows.length === 0) {
      return { items: [], total: 0, distanceById: new Map<string, number | null>() };
    }

    const total = Number(rows[0].total_count);
    const orderedIds = rows.map((r) => r.id);
    const distanceById = new Map<string, number | null>();
    for (const r of rows) {
      distanceById.set(
        r.id,
        r.distance_km !== null && r.distance_km !== undefined
          ? Math.round(Number(r.distance_km) * 100) / 100
          : null,
      );
    }

    // Batch-load complete public relations in a single Prisma query (no N+1)
    const hydrated = await this.prisma.venue.findMany({
      where: { id: { in: orderedIds } },
      include: PUBLIC_VENUE_INCLUDE,
    });

    const byId = new Map(hydrated.map((v) => [v.id, v]));
    const orderedVenues = orderedIds
      .map((id) => byId.get(id))
      .filter((v): v is NonNullable<typeof v> => Boolean(v));

    return { items: orderedVenues, total, distanceById };
  }

  /**
   * Compact bounding-box map markers query (max 100 markers + hasMore flag).
   * Handles antimeridian crossing (west > east) and avoids loading full galleries/relations.
   */
  async findPublicMapMarkers(filters: VenueMapBoundsFilters) {
    const crossesAntimeridian = filters.west > filters.east;
    const andConditions: Prisma.VenueWhereInput[] = [
      { status: VenueStatus.APPROVED },
      { archivedAt: null },
      { latitude: { not: null, gte: new Prisma.Decimal(filters.south.toFixed(6)), lte: new Prisma.Decimal(filters.north.toFixed(6)) } },
      crossesAntimeridian
        ? {
            OR: [
              { longitude: { gte: new Prisma.Decimal(filters.west.toFixed(6)) } },
              { longitude: { lte: new Prisma.Decimal(filters.east.toFixed(6)) } },
            ],
          }
        : {
            longitude: {
              not: null,
              gte: new Prisma.Decimal(filters.west.toFixed(6)),
              lte: new Prisma.Decimal(filters.east.toFixed(6)),
            },
          },
    ];

    if (filters.q) {
      const q = filters.q.trim();
      andConditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { locality: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { state: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (filters.city) {
      andConditions.push({
        city: { equals: filters.city.trim(), mode: 'insensitive' },
      });
    }

    if (filters.state) {
      andConditions.push({
        state: { equals: filters.state.trim(), mode: 'insensitive' },
      });
    }

    const courtWhere: Prisma.CourtWhereInput = { status: CourtStatus.ACTIVE };
    if (filters.sport) courtWhere.sport = filters.sport;
    if (filters.indoor !== undefined) courtWhere.indoor = filters.indoor;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      courtWhere.basePricePerHour = {};
      if (filters.minPrice !== undefined) {
        courtWhere.basePricePerHour.gte = new Prisma.Decimal(
          filters.minPrice.toFixed(2),
        );
      }
      if (filters.maxPrice !== undefined) {
        courtWhere.basePricePerHour.lte = new Prisma.Decimal(
          filters.maxPrice.toFixed(2),
        );
      }
    }
    andConditions.push({ courts: { some: courtWhere } });

    if (filters.amenityIds && filters.amenityIds.length > 0) {
      for (const token of filters.amenityIds) {
        andConditions.push({
          amenities: {
            some: {
              amenity: {
                isActive: true,
                OR: [
                  { id: token },
                  { slug: { equals: token, mode: 'insensitive' } },
                ],
              },
            },
          },
        });
      }
    }

    const MAX_MARKERS = 100;
    const rows = await this.prisma.venue.findMany({
      where: { AND: andConditions },
      select: {
        id: true,
        slug: true,
        name: true,
        locality: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        currency: true,
        images: {
          orderBy: [{ isCover: 'desc' }, { position: 'asc' }],
          take: 1,
          select: { secureUrl: true },
        },
        courts: {
          where: { status: CourtStatus.ACTIVE },
          select: { sport: true, basePricePerHour: true },
          orderBy: { basePricePerHour: 'asc' },
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
      take: MAX_MARKERS + 1,
    });

    const hasMore = rows.length > MAX_MARKERS;
    const limited = hasMore ? rows.slice(0, MAX_MARKERS) : rows;
    return { items: limited, hasMore };
  }

  async findPublicApprovedById(venueId: string) {
    return this.prisma.venue.findFirst({
      where: {
        id: venueId,
        status: VenueStatus.APPROVED,
        archivedAt: null,
      },
      include: PUBLIC_VENUE_INCLUDE,
    });
  }

  async findPublicApprovedCourts(venueId: string) {
    const venue = await this.prisma.venue.findFirst({
      where: {
        id: venueId,
        status: VenueStatus.APPROVED,
        archivedAt: null,
      },
      select: { id: true, name: true, currency: true },
    });

    if (!venue) {
      return null;
    }

    const courts = await this.prisma.court.findMany({
      where: {
        venueId,
        status: CourtStatus.ACTIVE,
      },
      orderBy: [{ sport: 'asc' }, { basePricePerHour: 'asc' }],
    });

    return { venue, courts };
  }
}
