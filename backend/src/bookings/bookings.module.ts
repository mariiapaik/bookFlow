import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { Service } from '../catalog/service.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { AuthModule } from '../auth/auth.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Service]),
    AuthModule,
    RemindersModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
