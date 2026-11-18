import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  @MinLength(10, { message: 'Invalid verification token format' })
  token!: string;
}
