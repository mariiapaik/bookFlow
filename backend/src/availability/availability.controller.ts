import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { UpsertWorkingHoursDto } from './working-hours.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  /** Public: bookable slots for a service on a date (YYYY-MM-DD). */
  @Get('slots')
  slots(@Query('serviceId') serviceId: string, @Query('date') date: string) {
    return this.availability.getSlots(serviceId, date);
  }

  @Get('working-hours')
  listHours() {
    return this.availability.listWorkingHours();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Put('working-hours')
  upsertHours(@Body() dto: UpsertWorkingHoursDto) {
    return this.availability.upsertWorkingHours(dto);
  }
}
