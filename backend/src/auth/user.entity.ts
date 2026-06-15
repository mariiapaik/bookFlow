import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export enum UserRole {
  OWNER = 'owner',
  STAFF = 'staff',
}

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role: UserRole;
}
