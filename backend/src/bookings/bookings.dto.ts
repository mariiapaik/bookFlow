import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { BookingStatus } from './booking.entity';

export class CreateBookingDto {
  @IsUUID()
  serviceId: string;

  @IsString()
  @MinLength(2)
  customerName: string;

  // Lenient: accept any region's format (salon clients are international).
  @IsString()
  @MinLength(5)
  customerPhone: string;

  @IsEmail()
  customerEmail: string;

  @IsISO8601()
  startAt: string;
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}

export class ListBookingsQuery {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
