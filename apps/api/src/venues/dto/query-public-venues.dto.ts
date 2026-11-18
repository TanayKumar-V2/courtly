import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Sport } from '@prisma/client';

export enum VenueSortOption {
  NEWEST = 'NEWEST',
  PRICE_LOW_TO_HIGH = 'PRICE_LOW_TO_HIGH',
  PRICE_HIGH_TO_LOW = 'PRICE_HIGH_TO_LOW',
  DISTANCE = 'DISTANCE',
}

function parseOptionalBoolean({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  return value;
}

export class QueryPublicVenuesDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search text cannot exceed 100 characters' })
  q?: string;

  // Backward-compatible alias for `q`
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search text cannot exceed 100 characters' })
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsEnum(Sport, { message: 'Invalid sport filter' })
  sport?: Sport;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  amenityIds?: string;

  // Backward-compatible alias for `amenityIds`
  @IsOptional()
  @IsString()
  @MaxLength(600)
  amenities?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'minPrice must be a valid monetary value' },
  )
  @Min(0, { message: 'minPrice cannot be negative' })
  @Max(1000000, { message: 'minPrice exceeds maximum allowed value' })
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'maxPrice must be a valid monetary value' },
  )
  @Min(0, { message: 'maxPrice cannot be negative' })
  @Max(1000000, { message: 'maxPrice exceeds maximum allowed value' })
  maxPrice?: number;

  @IsOptional()
  @Transform(parseOptionalBoolean)
  @IsBoolean({ message: 'indoor must be a boolean value' })
  indoor?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'latitude must be a valid number' })
  @Min(-90, { message: 'latitude must be between -90 and 90' })
  @Max(90, { message: 'latitude must be between -90 and 90' })
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'longitude must be a valid number' })
  @Min(-180, { message: 'longitude must be between -180 and 180' })
  @Max(180, { message: 'longitude must be between -180 and 180' })
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'radiusKm must be a valid number' })
  @Min(0.1, { message: 'radiusKm must be positive' })
  @Max(50, { message: 'radiusKm cannot exceed 50 km' })
  radiusKm?: number;

  @IsOptional()
  @IsEnum(VenueSortOption, {
    message:
      'sort must be NEWEST, PRICE_LOW_TO_HIGH, PRICE_HIGH_TO_LOW, or DISTANCE',
  })
  sort?: VenueSortOption;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

  // Backward-compatible alias for `pageSize`
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
