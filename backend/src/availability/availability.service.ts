import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { WorkingHours } from './working-hours.entity';
import { UpsertWorkingHoursDto } from './working-hours.dto';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { Service } from '../catalog/service.entity';

export interface Slot {
  start: string; // ISO
  end: string; // ISO
}

@Injectable()
export class AvailabilityService {
  private readonly tz: string;

  constructor(
    @InjectRepository(WorkingHours)
    private readonly hoursRepo: Repository<WorkingHours>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(Service)
    private readonly servicesRepo: Repository<Service>,
    config: ConfigService,
  ) {
    this.tz = config.get<string>('SALON_TIMEZONE', 'Europe/Berlin');
  }

  // ---- Working-hours management (admin) ----

  listWorkingHours() {
    return this.hoursRepo.find({ order: { dayOfWeek: 'ASC' } });
  }

  async upsertWorkingHours(dto: UpsertWorkingHoursDto) {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
    const existing = await this.hoursRepo.findOne({
      where: { dayOfWeek: dto.dayOfWeek },
    });
    const row = existing ?? this.hoursRepo.create({ dayOfWeek: dto.dayOfWeek });
    row.startTime = dto.startTime;
    row.endTime = dto.endTime;
    row.slotIntervalMinutes = dto.slotIntervalMinutes ?? row.slotIntervalMinutes ?? 30;
    row.active = dto.active ?? true;
    return this.hoursRepo.save(row);
  }

  /**
   * Compute bookable slots for a given service on a given calendar date.
   * A slot is valid when the full service duration fits inside working hours,
   * starts in the future, and does not overlap an existing active booking.
   */
  async getSlots(serviceId: string, dateISO: string): Promise<Slot[]> {
    const service = await this.servicesRepo.findOne({
      where: { id: serviceId, active: true },
    });
    if (!service) throw new BadRequestException('Unknown or inactive service');

    const day = DateTime.fromISO(dateISO, { zone: this.tz }).startOf('day');
    if (!day.isValid) throw new BadRequestException('Invalid date');

    // Luxon weekday: 1 (Mon) .. 7 (Sun). Map to 0 (Sun) .. 6 (Sat).
    const dow = day.weekday === 7 ? 0 : day.weekday;
    const wh = await this.hoursRepo.findOne({
      where: { dayOfWeek: dow, active: true },
    });
    if (!wh) return [];

    const open = this.atTime(day, wh.startTime);
    const close = this.atTime(day, wh.endTime);
    const now = DateTime.now().setZone(this.tz);

    const booked = await this.bookingsForRange(open, close);

    const slots: Slot[] = [];
    let cursor = open;
    const step = wh.slotIntervalMinutes;

    while (cursor.plus({ minutes: service.durationMinutes }) <= close) {
      const slotEnd = cursor.plus({ minutes: service.durationMinutes });
      const inFuture = cursor > now;
      const free = !booked.some((b) => this.overlaps(cursor, slotEnd, b));
      if (inFuture && free) {
        slots.push({ start: cursor.toISO()!, end: slotEnd.toISO()! });
      }
      cursor = cursor.plus({ minutes: step });
    }
    return slots;
  }

  private atTime(day: DateTime, hhmm: string): DateTime {
    const [h, m] = hhmm.split(':').map(Number);
    return day.set({ hour: h, minute: m, second: 0, millisecond: 0 });
  }

  private async bookingsForRange(open: DateTime, close: DateTime) {
    const rows = await this.bookingsRepo.find({
      where: {
        status: BookingStatus.CONFIRMED,
        startAt: Between(open.toJSDate(), close.toJSDate()),
      },
    });
    return rows.map((b) => ({
      start: DateTime.fromJSDate(b.startAt).setZone(this.tz),
      end: DateTime.fromJSDate(b.endAt).setZone(this.tz),
    }));
  }

  private overlaps(
    aStart: DateTime,
    aEnd: DateTime,
    b: { start: DateTime; end: DateTime },
  ): boolean {
    return aStart < b.end && b.start < aEnd;
  }
}
