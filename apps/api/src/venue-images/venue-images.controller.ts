import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../roles/roles.decorator.js';
import { Role } from '../roles/role.enum.js';
import { RolesGuard } from '../roles/roles.guard.js';
import { VenueImagesService } from './venue-images.service.js';
import { RegisterVenueImageDto } from './dto/register-venue-image.dto.js';
import { ReorderVenueImagesDto } from './dto/reorder-venue-images.dto.js';

@Controller('owner/venues/:venueId/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VENUE_OWNER)
export class VenueImagesController {
  constructor(private readonly venueImagesService: VenueImagesService) {}

  @Post('signature')
  async getUploadSignature(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
  ) {
    return this.venueImagesService.generateUploadSignature(user.id, venueId);
  }

  @Post()
  async registerImage(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Body() dto: RegisterVenueImageDto,
  ) {
    return this.venueImagesService.registerVerifiedImage(user.id, venueId, dto);
  }

  @Patch('reorder')
  async reorderImages(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Body() dto: ReorderVenueImagesDto,
  ) {
    return this.venueImagesService.reorderImages(user.id, venueId, dto);
  }

  @Patch(':imageId/cover')
  async setCoverImage(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
  ) {
    return this.venueImagesService.setCoverImage(user.id, venueId, imageId);
  }

  @Delete(':imageId')
  async deleteImage(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
  ) {
    return this.venueImagesService.deleteImage(user.id, venueId, imageId);
  }
}
