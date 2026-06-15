import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  ListBookingsQuery,
  UpdateBookingStatusDto,
} from './bookings.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  /** Public: a customer creates a booking. */
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create(dto);
  }

  // ---- Admin (staff + owner can view; both can change status) ----

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  list(@Query() query: ListBookingsQuery) {
    return this.bookings.list(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.bookings.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookings.updateStatus(id, dto);
  }
}
