import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { REMINDER_QUEUE } from './reminders.constants';
import { RemindersService } from './reminders.service';
import { RemindersProcessor } from './reminders.processor';
import { Booking } from '../bookings/booking.entity';

@Module({
  imports: [
    BullModule.registerQueue({ name: REMINDER_QUEUE }),
    TypeOrmModule.forFeature([Booking]),
  ],
  providers: [RemindersService, RemindersProcessor],
  exports: [RemindersService],
})
export class RemindersModule {}
