import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Sport } from '@prisma/client';

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

export class QueryVenueMapDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'north bound must be a valid latitude' })
  @Min(-90)
  @Max(90)
  north!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'south bound must be a valid latitude' })
  @Min(-90)
  @Max(90)
  south!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'east bound must be a valid longitude' })
  @Min(-180)
  @Max(180)
  east!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'west bound must be a valid longitude' })
  @Min(-180)
  @Max(180)
  west!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsEnum(Sport)
  sport?: Sport;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  amenityIds?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  maxPrice?: number;

  @IsOptional()
  @Transform(parseOptionalBoolean)
  @IsBoolean()
  indoor?: boolean;
}
