import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  REMINDER_LEAD_MS,
  REMINDER_QUEUE,
  ReminderJobData,
} from './reminders.constants';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectQueue(REMINDER_QUEUE) private readonly queue: Queue<ReminderJobData>,
  ) {}

  /**
   * Schedule a reminder to fire 24h before `startAt`.
   * Returns the job id (stored on the booking so it can be cancelled),
   * or null when the appointment is less than 24h away.
   */
  async schedule(bookingId: string, startAt: Date): Promise<string | null> {
    const delay = startAt.getTime() - REMINDER_LEAD_MS - Date.now();
    if (delay <= 0) {
      this.logger.log(`Booking ${bookingId} within 24h — no reminder scheduled.`);
      return null;
    }
    const job = await this.queue.add(
      'send-reminder',
      { bookingId },
      {
        delay,
        jobId: `reminder-${bookingId}`,
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
      },
    );
    return job.id ?? null;
  }

  async cancel(jobId: string | null): Promise<void> {
    if (!jobId) return;
    const job = await this.queue.getJob(jobId);
    if (job) await job.remove();
  }
}
