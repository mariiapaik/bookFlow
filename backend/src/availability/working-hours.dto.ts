import { IsBoolean, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpsertWorkingHoursDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @Matches(TIME_RE, { message: 'startTime must be HH:mm' })
  startTime: string;

  @Matches(TIME_RE, { message: 'endTime must be HH:mm' })
  endTime: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  slotIntervalMinutes?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
