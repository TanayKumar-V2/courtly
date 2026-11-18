import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../roles/roles.decorator.js';
import { Role } from '../roles/role.enum.js';
import { RolesGuard } from '../roles/roles.guard.js';
import { AmenitiesService } from './amenities.service.js';
import { UpdateVenueAmenitiesDto } from './dto/update-venue-amenities.dto.js';

@Controller()
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get('amenities')
  async getCatalogue() {
    return this.amenitiesService.listActiveAmenities();
  }

  @Put('owner/venues/:venueId/amenities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENUE_OWNER)
  async replaceVenueAmenities(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Body() dto: UpdateVenueAmenitiesDto,
  ) {
    return this.amenitiesService.replaceVenueAmenities(user.id, venueId, dto);
  }
}
