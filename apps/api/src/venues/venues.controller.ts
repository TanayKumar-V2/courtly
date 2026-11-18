import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VenueStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../roles/roles.decorator.js';
import { Role } from '../roles/role.enum.js';
import { RolesGuard } from '../roles/roles.guard.js';
import { VenuesService } from './venues.service.js';
import { CreateVenueDto } from './dto/create-venue.dto.js';
import { UpdateVenueDto } from './dto/update-venue.dto.js';
import { UpdateVenueLocationDto } from './dto/update-venue-location.dto.js';
import { QueryPublicVenuesDto } from './dto/query-public-venues.dto.js';
import { QueryVenueMapDto } from './dto/query-venue-map.dto.js';

@Controller()
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  // =========================================================
  // OWNER VENUE ENDPOINTS
  // =========================================================

  @Post('owner/venues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENUE_OWNER)
  async createVenue(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateVenueDto,
  ) {
    return this.venuesService.createDraftVenue(user.id, dto);
  }

  @Get('owner/venues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENUE_OWNER)
  async listOwnerVenues(
    @CurrentUser() user: { id: string },
    @Query('status') status?: VenueStatus,
  ) {
    return this.venuesService.listOwnerVenues(user.id, status);
  }

  @Get('owner/venues/:venueId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENUE_OWNER)
  async getOwnerVenue(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
  ) {
    return this.venuesService.getOwnerVenueById(user.id, venueId);
  }

  @Patch('owner/venues/:venueId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENUE_OWNER)
  async updateOwnerVenue(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Body() dto: UpdateVenueDto,
  ) {
    return this.venuesService.updateOwnerVenue(user.id, venueId, dto);
  }

  @Patch('owner/venues/:venueId/location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENUE_OWNER)
  async updateOwnerVenueLocation(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Body() dto: UpdateVenueLocationDto,
  ) {
    return this.venuesService.updateOwnerVenueLocation(user.id, venueId, dto);
  }

  @Delete('owner/venues/:venueId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENUE_OWNER)
  async deleteOrArchiveOwnerVenue(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
  ) {
    return this.venuesService.deleteOrArchiveOwnerVenue(user.id, venueId);
  }

  @Patch('owner/venues/:venueId/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENUE_OWNER)
  async submitVenueForReview(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
  ) {
    return this.venuesService.submitVenueForReview(user.id, venueId);
  }

  @Patch('owner/venues/:venueId/withdraw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENUE_OWNER)
  async withdrawVenueSubmission(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
  ) {
    return this.venuesService.withdrawVenueSubmission(user.id, venueId);
  }

  // =========================================================
  // PUBLIC VENUE DISCOVERY ENDPOINTS (APPROVED ONLY)
  // =========================================================

  @Get('venues')
  async listPublicVenues(@Query() query: QueryPublicVenuesDto) {
    return this.venuesService.listPublicApprovedVenues(query);
  }

  // MUST be declared before venues/:venueId so "map" is not treated as a UUID
  @Get('venues/map')
  async getVenueMapMarkers(@Query() query: QueryVenueMapDto) {
    return this.venuesService.getPublicMapMarkers(query);
  }

  @Get('venues/:venueId')
  async getPublicVenue(
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
  ) {
    return this.venuesService.getPublicApprovedVenueById(venueId);
  }

  @Get('venues/:venueId/courts')
  async getPublicVenueCourts(
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
  ) {
    return this.venuesService.getPublicApprovedVenueCourts(venueId);
  }
}
