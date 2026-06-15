import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  /** Duration of the appointment in minutes. */
  @Column({ type: 'int' })
  durationMinutes: number;

  /** Price stored in minor units (cents) to avoid float rounding. */
  @Column({ type: 'int' })
  priceCents: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
