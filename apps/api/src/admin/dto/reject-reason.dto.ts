import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectReasonDto {
  @IsString()
  @IsNotEmpty({ message: 'A rejection reason is required' })
  @MinLength(5, { message: 'Rejection reason must be at least 5 characters' })
  @MaxLength(1000)
  reason!: string;
}
