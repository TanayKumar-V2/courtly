import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CourtStatus, Sport } from '@prisma/client';

export class UpdateCourtDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsEnum(Sport, { message: 'Unsupported sport category' })
  @IsOptional()
  sport?: Sport;

  @IsString()
  @IsOptional()
  @MaxLength(600)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  surfaceType?: string;

  @IsBoolean()
  @IsOptional()
  indoor?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Maximum player capacity must be a whole number' })
  @Min(1, { message: 'Maximum player capacity must be at least 1' })
  @Max(100, { message: 'Maximum player capacity cannot exceed 100' })
  maxPlayers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Base hourly price must be a valid monetary amount (max 2 decimals)' },
  )
  @IsPositive({ message: 'Base hourly price must be greater than zero' })
  @Max(1000000, { message: 'Base hourly price exceeds allowed limit' })
  basePricePerHour?: number;

  @IsString()
  @IsOptional()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency must be an uppercase 3-letter ISO currency code',
  })
  currency?: string;

  @IsEnum(CourtStatus)
  @IsOptional()
  status?: CourtStatus;
}
