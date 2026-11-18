import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger;

  constructor(configService: ConfigService) {
    const logger = new Logger(PrismaService.name);
    const databaseUrl = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for PrismaService');
    }

    neonConfig.webSocketConstructor = ws;
    const adapter = new PrismaNeon(
      {
        connectionString: databaseUrl,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 20000,
      },
      {
        onPoolError: (err) => {
          logger.warn(`Neon pool error: ${err.message}`);
        },
        onConnectionError: (err) => {
          logger.warn(`Neon connection error: ${err.message}`);
        },
      },
    );

    super({
      adapter,
      transactionOptions: {
        maxWait: 15000,
        timeout: 30000,
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['warn', 'error']
          : ['error'],
    });

    this.logger = logger;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connected to Neon PostgreSQL database via Prisma 7 Neon adapter');
    } catch (error) {
      this.logger.error('Failed to connect to Neon PostgreSQL', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected from Neon PostgreSQL database');
  }
}
