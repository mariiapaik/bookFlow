import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Booking, BookingStatus } from './booking.entity';
import {
  CreateBookingDto,
  ListBookingsQuery,
  UpdateBookingStatusDto,
} from './bookings.dto';
import { Service } from '../catalog/service.entity';
import { MailService } from '../mail/mail.service';
import { RemindersService } from '../reminders/reminders.service';

const PG_EXCLUSION_VIOLATION = '23P01';

@Injectable()
export class BookingsService implements OnModuleInit {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookings: Repository<Booking>,
    @InjectRepository(Service)
    private readonly services: Repository<Service>,
    private readonly dataSource: DataSource,
    private readonly mail: MailService,
    private readonly reminders: RemindersService,
  ) {}

  /**
   * Install a Postgres exclusion constraint so two CONFIRMED bookings can never
   * occupy overlapping time ranges — enforced at the DB level, immune to races
   * between concurrent requests.
   */
  async onModuleInit() {
    try {
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS btree_gist');
      await this.dataSource.query(`
        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlapping_bookings;
        ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
          EXCLUDE USING gist (tstzrange("startAt", "endAt") WITH &&)
          WHERE (status = 'confirmed');
      `);
      this.logger.log('Overlap-exclusion constraint ensured.');
    } catch (err) {
      this.logger.warn(`Could not ensure exclusion constraint: ${err}`);
    }
  }

  async create(dto: CreateBookingDto): Promise<Booking> {
    const service = await this.services.findOne({
      where: { id: dto.serviceId, active: true },
    });
    if (!service) throw new BadRequestException('Unknown or inactive service');

    const startAt = new Date(dto.startAt);
    if (Number.isNaN(startAt.getTime()) || startAt.getTime() <= Date.now()) {
      throw new BadRequestException('startAt must be a valid future time');
    }
    const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);

    let saved: Booking;
    try {
      saved = await this.bookings.save(
        this.bookings.create({
          serviceId: service.id,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerEmail: dto.customerEmail,
          startAt,
          endAt,
          status: BookingStatus.CONFIRMED,
        }),
      );
    } catch (err: any) {
      if (err?.code === PG_EXCLUSION_VIOLATION) {
        throw new ConflictException('That time slot was just taken');
      }
      throw err;
    }

    // Hydrate the service relation for email rendering.
    saved.service = service;

    // Confirmation email (fire-and-forget — failures are logged, not fatal).
    await this.mail.sendConfirmation(saved);

    // Schedule the 24h reminder and persist its job id for later cancellation.
    // Non-fatal: a queue failure must not break an already-confirmed booking.
    try {
      const jobId = await this.reminders.schedule(saved.id, saved.startAt);
      if (jobId) {
        saved.reminderJobId = jobId;
        await this.bookings.update(saved.id, { reminderJobId: jobId });
      }
    } catch (err) {
      this.logger.error(`Failed to schedule reminder for ${saved.id}: ${err}`);
    }

    return saved;
  }

  async list(query: ListBookingsQuery): Promise<Booking[]> {
    const where: FindOptionsWhere<Booking> = {};
    if (query.status) where.status = query.status;
    const qb = this.bookings
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.service', 'service')
      .orderBy('b.startAt', 'DESC');
    if (query.status) qb.andWhere('b.status = :status', { status: query.status });
    if (query.from) qb.andWhere('b.startAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('b.startAt <= :to', { to: query.to });
    return qb.getMany();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookings.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<Booking> {
    const booking = await this.findOne(id);
    const previous = booking.status;
    booking.status = dto.status;
    const saved = await this.bookings.save(booking);

    if (
      dto.status === BookingStatus.CANCELLED &&
      previous !== BookingStatus.CANCELLED
    ) {
      await this.reminders.cancel(booking.reminderJobId);
      await this.mail.sendCancellation(saved);
    }
    return saved;
  }
}
