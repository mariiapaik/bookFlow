import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * Recurring weekly working hours set by staff/owner.
 * One row per weekday that the salon is open.
 */
@Entity('working_hours')
@Unique(['dayOfWeek'])
export class WorkingHours {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 0 = Sunday ... 6 = Saturday (Luxon weekday is mapped to this range). */
  @Column({ type: 'int' })
  dayOfWeek: number;

  /** "09:00" — local salon time. */
  @Column({ type: 'varchar', length: 5 })
  startTime: string;

  /** "18:00" — local salon time. */
  @Column({ type: 'varchar', length: 5 })
  endTime: string;

  /** Granularity of generated slots in minutes. */
  @Column({ type: 'int', default: 30 })
  slotIntervalMinutes: number;

  @Column({ default: true })
  active: boolean;
}
