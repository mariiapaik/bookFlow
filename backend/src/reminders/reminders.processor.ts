import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { REMINDER_QUEUE, ReminderJobData } from './reminders.constants';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { MailService } from '../mail/mail.service';

@Processor(REMINDER_QUEUE)
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookings: Repository<Booking>,
    private readonly mail: MailService,
  ) {
    super();
  }

  async process(job: Job<ReminderJobData>): Promise<void> {
    const booking = await this.bookings.findOne({
      where: { id: job.data.bookingId },
    });
    if (!booking) {
      this.logger.warn(`Reminder skipped — booking ${job.data.bookingId} gone.`);
      return;
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      this.logger.log(`Reminder skipped — booking ${booking.id} not confirmed.`);
      return;
    }
    await this.mail.sendReminder(booking);
    this.logger.log(`Reminder sent for booking ${booking.id}.`);
  }
}
