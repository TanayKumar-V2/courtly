import { Module } from '@nestjs/common';
import { VenueImagesController } from './venue-images.controller.js';
import { VenueImagesService } from './venue-images.service.js';

@Module({
  controllers: [VenueImagesController],
  providers: [VenueImagesService],
  exports: [VenueImagesService],
})
export class VenueImagesModule {}
