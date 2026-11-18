import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SkillLevel, Sport } from '@prisma/client';

export class SportSkillDto {
  @IsEnum(Sport, { message: 'Invalid sport provided' })
  sport!: Sport;

  @IsEnum(SkillLevel, { message: 'Invalid skill level provided' })
  skillLevel!: SkillLevel;
}

export class UpdatePlayerProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80, { message: 'City cannot exceed 80 characters' })
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80, { message: 'State cannot exceed 80 characters' })
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80, { message: 'Country cannot exceed 80 characters' })
  country?: string;

  @IsArray()
  @IsOptional()
  @IsEnum(Sport, { each: true, message: 'Invalid preferred sport provided' })
  preferredSports?: Sport[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SportSkillDto)
  sportSkills?: SportSkillDto[];
}
