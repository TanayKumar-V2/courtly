import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOwnerApplicationDto {
  @IsString()
  @IsNotEmpty({ message: 'Business or facility name is required' })
  @MinLength(2)
  @MaxLength(120)
  businessName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Business type is required' })
  @MinLength(2)
  @MaxLength(80)
  businessType!: string;

  @IsString()
  @IsNotEmpty({ message: 'Contact person name is required' })
  @MinLength(2)
  @MaxLength(100)
  contactPerson!: string;

  @IsString()
  @IsNotEmpty({ message: 'Contact phone is required' })
  @MinLength(7)
  @MaxLength(20)
  contactPhone!: string;

  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @MaxLength(80)
  city!: string;

  @IsString()
  @IsNotEmpty({ message: 'State is required' })
  @MaxLength(80)
  state!: string;

  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  @MaxLength(80)
  country!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1500)
  additionalInformation?: string;
}
