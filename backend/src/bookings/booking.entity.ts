import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from '../catalog/service.entity';

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('bookings')
@Index(['startAt'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Service, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column()
  serviceId: string;

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column()
  customerEmail: string;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.CONFIRMED,
  })
  status: BookingStatus;

  /** BullMQ job id for the 24h reminder, so we can cancel it on cancellation. */
  @Column({ type: 'varchar', nullable: true })
  reminderJobId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
