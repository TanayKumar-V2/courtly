import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class UpdateVenueAmenitiesDto {
  @IsArray({ message: 'amenityIds must be an array of amenity IDs' })
  @ArrayUnique({ message: 'Duplicate amenity IDs are not allowed' })
  @IsUUID('4', { each: true, message: 'Each amenity ID must be a valid UUID' })
  amenityIds!: string[];
}
