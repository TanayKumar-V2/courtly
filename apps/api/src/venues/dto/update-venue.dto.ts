import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateVenueDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(140)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(25)
  businessContactPhone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Business contact email must be a valid email address' })
  @MaxLength(160)
  businessContactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  addressLine1?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  addressLine2?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  locality?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude must be a valid number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  longitude?: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  timezone?: string;

  @IsString()
  @IsOptional()
  @Length(3, 3, { message: 'Currency must be a 3-letter ISO currency code' })
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency must be an uppercase 3-letter ISO currency code (e.g. INR)',
  })
  currency?: string;
}
