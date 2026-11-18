import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository.js';
import { PasswordService } from './services/password.service.js';
import { TokenService } from './services/token.service.js';
import { MailService } from '../mail/mail.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTtlDays: number;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.refreshTtlDays = parseInt(
      this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS') ||
        process.env.REFRESH_TOKEN_TTL_DAYS ||
        '30',
      10,
    );
  }

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.authRepository.findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);
    const rawVerificationToken = this.tokenService.generateRandomToken(32);
    const verificationTokenHash = this.tokenService.hashToken(rawVerificationToken);

    const verificationExpiresAt = new Date();
    verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24); // 24 hours

    const user = await this.authRepository.createUserWithProfileAndToken({
      fullName: dto.fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      city: dto.city?.trim(),
      preferredSports: dto.preferredSports,
      verificationTokenHash,
      verificationExpiresAt,
    });

    // Send verification email via MailService (or terminal logger in dev)
    await this.mailService.sendVerificationEmail(
      user.email,
      rawVerificationToken,
      user.fullName,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.authRepository.findUserByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact Courtly support.',
      );
    }

    if (user.status === 'PENDING_VERIFICATION') {
      throw new UnauthorizedException(
        'Please verify your email before logging in. Check your inbox for the verification link.',
      );
    }

    // Create session and opaque refresh token
    const rawRefreshToken = this.tokenService.generateRandomToken(32);
    const refreshTokenHash = this.tokenService.hashToken(rawRefreshToken);
    const familyId = this.tokenService.generateRandomToken(16);

    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + this.refreshTtlDays);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + this.refreshTtlDays);

    const { session } = await this.authRepository.createSessionAndRefreshToken({
      userId: user.id,
      deviceName: dto.deviceName || 'Android Device',
      platform: dto.platform || 'android',
      tokenHash: refreshTokenHash,
      familyId,
      sessionExpiresAt,
      refreshExpiresAt,
    });

    const accessToken = await this.tokenService.signAccessToken(user.id, session.id);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: this.sanitizeUser(user),
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const oldTokenHash = this.tokenService.hashToken(dto.refreshToken);
    const newRawRefreshToken = this.tokenService.generateRandomToken(32);
    const newTokenHash = this.tokenService.hashToken(newRawRefreshToken);

    const newRefreshExpiresAt = new Date();
    newRefreshExpiresAt.setDate(newRefreshExpiresAt.getDate() + this.refreshTtlDays);

    const result = await this.authRepository.rotateRefreshToken(
      oldTokenHash,
      newTokenHash,
      newRefreshExpiresAt,
    );

    if (result.status === 'REUSE_DETECTED') {
      throw new UnauthorizedException(
        'Refresh token reuse detected. All sessions in this token family have been revoked.',
      );
    }

    if (result.status === 'EXPIRED') {
      throw new UnauthorizedException('Refresh token has expired. Please log in again.');
    }

    if (result.status === 'SESSION_INVALID' || result.status === 'NOT_FOUND') {
      throw new UnauthorizedException('Invalid session. Please log in again.');
    }

    const accessToken = await this.tokenService.signAccessToken(
      result.userId!,
      result.session.id,
    );

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: 900,
    };
  }

  async logout(sessionId: string) {
    await this.authRepository.revokeSessionAndFamily(sessionId);
    return { message: 'Successfully logged out' };
  }

  async logoutAll(userId: string) {
    await this.authRepository.revokeAllUserSessions(userId);
    return { message: 'Successfully logged out from all devices' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = this.tokenService.hashToken(dto.token);
    const result = await this.authRepository.verifyEmailToken(tokenHash);

    if (!result.success) {
      throw new BadRequestException(result.reason || 'Email verification failed');
    }

    return {
      message: 'Email successfully verified. You can now log in to Courtly.',
    };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    if (user && user.status === 'PENDING_VERIFICATION') {
      const rawVerificationToken = this.tokenService.generateRandomToken(32);
      const verificationTokenHash = this.tokenService.hashToken(rawVerificationToken);

      const verificationExpiresAt = new Date();
      verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24);

      await this.authRepository.createEmailVerificationToken(
        user.id,
        verificationTokenHash,
        verificationExpiresAt,
      );

      await this.mailService.sendVerificationEmail(
        user.email,
        rawVerificationToken,
        user.fullName,
      );
    }

    // Always return generic response to prevent account enumeration
    return {
      message:
        'If an unverified account exists for this email, a verification link has been sent.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    if (user) {
      const rawResetToken = this.tokenService.generateRandomToken(32);
      const resetTokenHash = this.tokenService.hashToken(rawResetToken);

      const resetExpiresAt = new Date();
      resetExpiresAt.setMinutes(resetExpiresAt.getMinutes() + 15); // 15 minutes

      await this.authRepository.createPasswordResetToken(
        user.id,
        resetTokenHash,
        resetExpiresAt,
      );

      await this.mailService.sendPasswordResetEmail(
        user.email,
        rawResetToken,
        user.fullName,
      );
    }

    // Return generic message to prevent account enumeration
    return {
      message:
        'If an account exists with this email, password reset instructions have been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.tokenService.hashToken(dto.token);
    const newPasswordHash = await this.passwordService.hashPassword(dto.newPassword);

    const result = await this.authRepository.resetPasswordWithToken(
      tokenHash,
      newPasswordHash,
    );

    if (!result.success) {
      throw new BadRequestException(result.reason || 'Password reset failed');
    }

    return {
      message:
        'Password has been successfully reset. Please log in with your new password.',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await this.passwordService.verifyPassword(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password does not match');
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.newPassword);
    await this.authRepository.updatePasswordAndRevokeSessions(
      userId,
      newPasswordHash,
    );

    return {
      message:
        'Password successfully changed. All other device sessions have been revoked.',
    };
  }

  async getMe(userId: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User account not found');
    }
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: any) {
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    return {
      ...safeUser,
      roles: user.roles ? user.roles.map((r: any) => r.role) : [],
    };
  }
}
