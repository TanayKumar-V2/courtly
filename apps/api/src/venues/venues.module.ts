import { Global, Module } from '@nestjs/common';
import { VenuesController } from './venues.controller.js';
import { VenuesService } from './venues.service.js';
import { VenuesRepository } from './venues.repository.js';
import { VenueCacheService } from './venue-cache.service.js';

@Global()
@Module({
  controllers: [VenuesController],
  providers: [VenuesService, VenuesRepository, VenueCacheService],
  exports: [VenuesService, VenuesRepository, VenueCacheService],
})
export class VenuesModule {}
