import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';
import { RedisService } from '../redis/redis.service.js';

const VERSION_KEY = 'courtly:venues:cache:version';
const KEY_PREFIX = 'courtly:venues:public';
const DEFAULT_TTL_SECONDS = 60;

@Injectable()
export class VenueCacheService {
  private readonly logger = new Logger(VenueCacheService.name);

  constructor(private readonly redisService: RedisService) {}

  buildCanonicalKey(
    version: string,
    scope: 'search' | 'detail' | 'map' | 'courts',
    params: Record<string, unknown>,
  ): string {
    const normalized = this.canonicalize(params);
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex')
      .slice(0, 24);
    return `${KEY_PREFIX}:v${version}:${scope}:${hash}`;
  }

  async get<T>(
    scope: 'search' | 'detail' | 'map' | 'courts',
    params: Record<string, unknown>,
  ): Promise<T | null> {
    const client = this.redisService.getClient();
    if (!client) return null;

    try {
      const version = (await client.get(VERSION_KEY)) || '1';
      const key = this.buildCanonicalKey(version, scope, params);
      const cached = await client.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Redis cache GET failed (${scope}), falling back to PostgreSQL: ${msg}`,
      );
      return null;
    }
  }

  async set(
    scope: 'search' | 'detail' | 'map' | 'courts',
    params: Record<string, unknown>,
    payload: unknown,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    const client = this.redisService.getClient();
    if (!client) return;

    try {
      const version = (await client.get(VERSION_KEY)) || '1';
      const key = this.buildCanonicalKey(version, scope, params);
      await client.set(key, JSON.stringify(payload), 'EX', ttlSeconds);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis cache SET failed (${scope}): ${msg}`);
    }
  }

  async invalidateAll(): Promise<void> {
    const client = this.redisService.getClient();
    if (!client) return;

    try {
      await client.incr(VERSION_KEY);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis cache invalidation failed: ${msg}`);
    }
  }

  private canonicalize(value: unknown): unknown {
    if (Array.isArray(value)) {
      return [...value].map((v) => this.canonicalize(v)).sort();
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .sort(([a], [b]) => a.localeCompare(b));
      const out: Record<string, unknown> = {};
      for (const [k, v] of entries) {
        out[k] = typeof v === 'string' ? v.trim().toLowerCase() : this.canonicalize(v);
      }
      return out;
    }
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return value;
  }
}
