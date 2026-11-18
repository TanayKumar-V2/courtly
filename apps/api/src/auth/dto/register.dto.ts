import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Sport } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(80, { message: 'Full name cannot exceed 80 characters' })
  fullName!: string;

  @IsEmail({}, { message: 'A valid email address is required' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  password!: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  city?: string;

  @IsArray()
  @IsOptional()
  @IsEnum(Sport, { each: true, message: 'Invalid sport provided' })
  preferredSports?: Sport[];
}
