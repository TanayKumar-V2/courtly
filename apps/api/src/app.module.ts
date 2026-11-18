import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration.js';
import { validateConfig } from './config/config.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { MailModule } from './mail/mail.module.js';
import { RolesModule } from './roles/roles.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { HealthModule } from './health/health.module.js';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';
import { OwnerApplicationsModule } from './owner-applications/owner-applications.module.js';
import { VenuesModule } from './venues/venues.module.js';
import { CourtsModule } from './courts/courts.module.js';
import { AmenitiesModule } from './amenities/amenities.module.js';
import { VenueImagesModule } from './venue-images/venue-images.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateConfig,
    }),
    PrismaModule,
    RedisModule,
    MailModule,
    CloudinaryModule,
    RolesModule,
    AuthModule,
    UsersModule,
    HealthModule,
    OwnerApplicationsModule,
    VenuesModule,
    CourtsModule,
    AmenitiesModule,
    VenueImagesModule,
    AdminModule,
  ],
})
export class AppModule {}
