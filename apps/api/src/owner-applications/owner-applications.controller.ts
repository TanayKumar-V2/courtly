import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { OwnerApplicationsService } from './owner-applications.service.js';
import { CreateOwnerApplicationDto } from './dto/create-owner-application.dto.js';

@Controller('owner-applications')
@UseGuards(JwtAuthGuard)
export class OwnerApplicationsController {
  constructor(
    private readonly ownerApplicationsService: OwnerApplicationsService,
  ) {}

  @Post()
  async submitApplication(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateOwnerApplicationDto,
  ) {
    return this.ownerApplicationsService.submitApplication(user.id, dto);
  }

  @Get('me')
  async getMyApplicationStatus(@CurrentUser() user: { id: string }) {
    return this.ownerApplicationsService.getMyApplicationStatus(user.id);
  }
}
