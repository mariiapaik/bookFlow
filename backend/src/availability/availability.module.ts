import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkingHours } from './working-hours.entity';
import { Booking } from '../bookings/booking.entity';
import { Service } from '../catalog/service.entity';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkingHours, Booking, Service]),
    AuthModule,
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
