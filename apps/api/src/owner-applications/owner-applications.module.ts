import { Module } from '@nestjs/common';
import { OwnerApplicationsController } from './owner-applications.controller.js';
import { OwnerApplicationsService } from './owner-applications.service.js';

@Module({
  controllers: [OwnerApplicationsController],
  providers: [OwnerApplicationsService],
  exports: [OwnerApplicationsService],
})
export class OwnerApplicationsModule {}
