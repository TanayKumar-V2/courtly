import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CourtsService } from './courts.service.js';
import { CreateCourtDto } from './dto/create-court.dto.js';
import { UpdateCourtDto } from './dto/update-court.dto.js';

@Controller('owner/venues/:venueId/courts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VENUE_OWNER)
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Post()
  async createCourt(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Body() dto: CreateCourtDto,
  ) {
    return this.courtsService.createCourt(user.id, venueId, dto);
  }

  @Get()
  async listCourts(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
  ) {
    return this.courtsService.listVenueCourts(user.id, venueId);
  }

  @Get(':courtId')
  async getCourt(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Param('courtId', new ParseUUIDPipe()) courtId: string,
  ) {
    return this.courtsService.getVenueCourtById(user.id, venueId, courtId);
  }

  @Patch(':courtId')
  async updateCourt(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Param('courtId', new ParseUUIDPipe()) courtId: string,
    @Body() dto: UpdateCourtDto,
  ) {
    return this.courtsService.updateCourt(user.id, venueId, courtId, dto);
  }

  @Delete(':courtId')
  async deleteCourt(
    @CurrentUser() user: { id: string },
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Param('courtId', new ParseUUIDPipe()) courtId: string,
  ) {
    return this.courtsService.archiveOrDeleteCourt(user.id, venueId, courtId);
  }
}
