import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { Service } from './catalog/service.entity';
import { WorkingHours } from './availability/working-hours.entity';
import { Booking } from './bookings/booking.entity';
import { User } from './auth/user.entity';

import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { AvailabilityModule } from './availability/availability.module';
import { BookingsModule } from './bookings/bookings.module';
import { MailModule } from './mail/mail.module';
import { RemindersModule } from './reminders/reminders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'bookflow'),
        password: config.get<string>('DB_PASSWORD', 'bookflow'),
        database: config.get<string>('DB_NAME', 'bookflow'),
        entities: [Service, WorkingHours, Booking, User],
        synchronize: true, // MVP convenience; use migrations in production
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    AuthModule,
    CatalogModule,
    AvailabilityModule,
    BookingsModule,
    MailModule,
    RemindersModule,
  ],
})
export class AppModule {}
