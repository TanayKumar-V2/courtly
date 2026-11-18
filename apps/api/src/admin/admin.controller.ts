import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../roles/roles.decorator.js';
import { Role } from '../roles/role.enum.js';
import { RolesGuard } from '../roles/roles.guard.js';
import { AdminService } from './admin.service.js';
import {
  AdminQueryApplicationsDto,
  AdminQueryVenuesDto,
} from './dto/admin-query.dto.js';
import { RejectReasonDto } from './dto/reject-reason.dto.js';
import { PauseVenueDto } from './dto/pause-venue.dto.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // =========================================================
  // OWNER APPLICATIONS
  // =========================================================

  @Get('owner-applications')
  async listOwnerApplications(@Query() query: AdminQueryApplicationsDto) {
    return this.adminService.listOwnerApplications(query);
  }

  @Get('owner-applications/:id')
  async getOwnerApplication(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.getOwnerApplicationById(id);
  }

  @Patch('owner-applications/:id/approve')
  async approveOwnerApplication(
    @CurrentUser() admin: { id: string },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.adminService.approveOwnerApplication(admin.id, id);
  }

  @Patch('owner-applications/:id/reject')
  async rejectOwnerApplication(
    @CurrentUser() admin: { id: string },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectReasonDto,
  ) {
    return this.adminService.rejectOwnerApplication(admin.id, id, dto.reason);
  }

  // =========================================================
  // VENUE MODERATION
  // =========================================================

  @Get('venues')
  async listVenues(@Query() query: AdminQueryVenuesDto) {
    return this.adminService.listVenuesForModeration(query);
  }

  @Get('venues/:venueId')
  async getVenue(@Param('venueId', new ParseUUIDPipe()) venueId: string) {
    return this.adminService.getVenueForModeration(venueId);
  }

  @Patch('venues/:venueId/approve')
  async approveVenue(
    @CurrentUser() admin: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
  ) {
    return this.adminService.approveVenue(admin.id, venueId);
  }

  @Patch('venues/:venueId/reject')
  async rejectVenue(
    @CurrentUser() admin: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Body() dto: RejectReasonDto,
  ) {
    return this.adminService.rejectVenue(admin.id, venueId, dto.reason);
  }

  @Patch('venues/:venueId/pause')
  async pauseVenue(
    @CurrentUser() admin: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Body() dto: PauseVenueDto,
  ) {
    return this.adminService.pauseVenue(admin.id, venueId, dto.reason);
  }
}
