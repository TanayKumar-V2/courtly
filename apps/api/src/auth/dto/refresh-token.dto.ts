import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  @MinLength(10, { message: 'Invalid refresh token format' })
  refreshToken!: string;
}
