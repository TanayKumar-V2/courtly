import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterVenueImageDto {
  @IsString()
  @IsNotEmpty({ message: 'Cloudinary publicId is required' })
  @MaxLength(300)
  publicId!: string;

  @IsBoolean()
  @IsOptional()
  isCover?: boolean;
}
