import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { DateTime } from 'luxon';
import { Booking } from '../bookings/booking.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;
  private readonly tz: string;
  private readonly salonName: string;

  constructor(config: ConfigService) {
    this.from = config.get<string>('MAIL_FROM', 'BookFlow <no-reply@bookflow.app>');
    this.tz = config.get<string>('SALON_TIMEZONE', 'Europe/Berlin');
    this.salonName = config.get<string>('SALON_NAME', 'BookFlow Salon');

    const host = config.get<string>('SMTP_HOST');
    if (!host) {
      // No SMTP configured — log emails instead of sending (dev/demo mode).
      this.transporter = null;
      this.logger.warn('SMTP not configured — emails will be logged, not sent.');
      return;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: config.get<number>('SMTP_PORT', 587),
      secure: config.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: config.get<string>('SMTP_USER')
        ? {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASS'),
          }
        : undefined,
    });
  }

  async sendConfirmation(booking: Booking) {
    const when = this.formatWhen(booking.startAt);
    await this.send(
      booking.customerEmail,
      `Your booking at ${this.salonName} is confirmed`,
      `<h2>Booking confirmed ✅</h2>
       <p>Hi ${booking.customerName},</p>
       <p>Your appointment for <b>${booking.service?.name}</b> is confirmed for:</p>
       <p style="font-size:18px"><b>${when}</b></p>
       <p>See you soon!<br/>${this.salonName}</p>`,
    );
  }

  async sendReminder(booking: Booking) {
    const when = this.formatWhen(booking.startAt);
    await this.send(
      booking.customerEmail,
      `Reminder: your appointment at ${this.salonName} tomorrow`,
      `<h2>See you tomorrow ⏰</h2>
       <p>Hi ${booking.customerName},</p>
       <p>This is a reminder for your <b>${booking.service?.name}</b> appointment:</p>
       <p style="font-size:18px"><b>${when}</b></p>
       <p>${this.salonName}</p>`,
    );
  }

  async sendCancellation(booking: Booking) {
    const when = this.formatWhen(booking.startAt);
    await this.send(
      booking.customerEmail,
      `Your booking at ${this.salonName} was cancelled`,
      `<h2>Booking cancelled</h2>
       <p>Hi ${booking.customerName},</p>
       <p>Your appointment for <b>${booking.service?.name}</b> on ${when} has been cancelled.</p>
       <p>${this.salonName}</p>`,
    );
  }

  private formatWhen(date: Date): string {
    return DateTime.fromJSDate(date)
      .setZone(this.tz)
      .toFormat("cccc, dd LLL yyyy 'at' HH:mm");
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[email→${to}] ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send "${subject}" to ${to}: ${err}`);
    }
  }
}
