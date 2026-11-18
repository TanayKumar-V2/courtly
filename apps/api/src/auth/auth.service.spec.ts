import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { PasswordService } from './services/password.service.js';
import { TokenService } from './services/token.service.js';
import { MailService } from '../mail/mail.service.js';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuthRepo: any;
  let mockPasswordService: any;
  let mockTokenService: any;
  let mockMailService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockAuthRepo = {
      findUserByEmail: jest.fn<() => Promise<any>>(),
      findUserById: jest.fn<() => Promise<any>>(),
      createUserWithProfileAndToken: jest.fn<() => Promise<any>>(),
      createSessionAndRefreshToken: jest.fn<() => Promise<any>>(),
      rotateRefreshToken: jest.fn<() => Promise<any>>(),
      revokeSessionAndFamily: jest.fn<() => Promise<any>>(),
      revokeAllUserSessions: jest.fn<() => Promise<any>>(),
      verifyEmailToken: jest.fn<() => Promise<any>>(),
      createEmailVerificationToken: jest.fn<() => Promise<any>>(),
      createPasswordResetToken: jest.fn<() => Promise<any>>(),
      resetPasswordWithToken: jest.fn<() => Promise<any>>(),
      updatePasswordAndRevokeSessions: jest.fn<() => Promise<any>>(),
    };

    mockPasswordService = {
      hashPassword: jest.fn<any>().mockImplementation(async (pw: any) => `argon2id_hashed_${pw}`),
      verifyPassword: jest.fn<() => Promise<boolean>>(),
    };

    mockTokenService = {
      signAccessToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock_jwt_access_token'),
      generateRandomToken: jest.fn<any>().mockReturnValue('mock_random_token_32_bytes'),
      hashToken: jest.fn<any>().mockImplementation((t: any) => `sha256_${t}`),
    };

    mockMailService = {
      sendVerificationEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };

    mockConfigService = {
      get: jest.fn<any>().mockReturnValue('30'),
    };

    service = new AuthService(
      mockAuthRepo as AuthRepository,
      mockPasswordService as PasswordService,
      mockTokenService as TokenService,
      mockMailService as MailService,
      mockConfigService as ConfigService,
    );
  });

  describe('register', () => {
    it('should register a new player, hash password with Argon2id, and send verification email', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthRepo.createUserWithProfileAndToken.mockResolvedValue({
        id: 'u-123',
        fullName: 'Arjun Kumar',
        email: 'arjun@courtly.app',
        passwordHash: 'argon2id_hashed_Secret1234!',
        status: 'PENDING_VERIFICATION',
        roles: [{ role: 'PLAYER' }],
        profile: { city: 'Bengaluru', preferredSports: ['FOOTBALL'] },
      });

      const result = await service.register({
        fullName: 'Arjun Kumar',
        email: 'ARJUN@courtly.app',
        password: 'Secret1234!',
        city: 'Bengaluru',
        preferredSports: ['FOOTBALL' as any],
      });

      expect(mockAuthRepo.findUserByEmail).toHaveBeenCalledWith('arjun@courtly.app');
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith('Secret1234!');
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
        'arjun@courtly.app',
        'mock_random_token_32_bytes',
        'Arjun Kumar',
      );
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.roles).toContain('PLAYER');
    });

    it('should throw ConflictException if email is already taken', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({ id: 'u-existing' });

      await expect(
        service.register({
          fullName: 'Duplicate User',
          email: 'duplicate@courtly.app',
          password: 'Secret1234!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully log in an active verified player', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        fullName: 'Arjun Kumar',
        email: 'arjun@courtly.app',
        passwordHash: 'valid_hash',
        status: 'ACTIVE',
        roles: [{ role: 'PLAYER' }],
        profile: { city: 'Bengaluru' },
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockAuthRepo.createSessionAndRefreshToken.mockResolvedValue({
        session: { id: 's-123', userId: 'u-123' },
        refreshToken: { id: 'rt-1' },
      });

      const result = await service.login({
        email: 'arjun@courtly.app',
        password: 'CorrectPassword!',
        deviceName: 'Pixel 8',
        platform: 'android',
      });

      expect(result.accessToken).toBe('mock_jwt_access_token');
      expect(result.refreshToken).toBe('mock_random_token_32_bytes');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should reject login with invalid password', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        passwordHash: 'valid_hash',
        status: 'ACTIVE',
      });
      mockPasswordService.verifyPassword.mockResolvedValue(false);

      await expect(
        service.login({
          email: 'arjun@courtly.app',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login for suspended account', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        passwordHash: 'valid_hash',
        status: 'SUSPENDED',
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);

      await expect(
        service.login({
          email: 'arjun@courtly.app',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login for unverified account', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        passwordHash: 'valid_hash',
        status: 'PENDING_VERIFICATION',
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);

      await expect(
        service.login({
          email: 'arjun@courtly.app',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate token successfully', async () => {
      mockAuthRepo.rotateRefreshToken.mockResolvedValue({
        status: 'SUCCESS',
        session: { id: 's-123' },
        newRefreshToken: { id: 'rt-2' },
        userId: 'u-123',
      });

      const result = await service.refresh({ refreshToken: 'active_refresh_token' });
      expect(result.accessToken).toBe('mock_jwt_access_token');
      expect(result.refreshToken).toBe('mock_random_token_32_bytes');
    });

    it('should detect token reuse and revoke token family', async () => {
      mockAuthRepo.rotateRefreshToken.mockResolvedValue({
        status: 'REUSE_DETECTED',
        userId: 'u-123',
      });

      await expect(
        service.refresh({ refreshToken: 'already_used_refresh_token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject expired refresh token', async () => {
      mockAuthRepo.rotateRefreshToken.mockResolvedValue({
        status: 'EXPIRED',
      });

      await expect(
        service.refresh({ refreshToken: 'expired_refresh_token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout & logoutAll', () => {
    it('should revoke session and token family on logout', async () => {
      mockAuthRepo.revokeSessionAndFamily.mockResolvedValue(undefined);
      const result = await service.logout('session-id-1');
      expect(mockAuthRepo.revokeSessionAndFamily).toHaveBeenCalledWith('session-id-1');
      expect(result.message).toContain('logged out');
    });

    it('should revoke all user sessions on logout-all', async () => {
      mockAuthRepo.revokeAllUserSessions.mockResolvedValue(undefined);
      const result = await service.logoutAll('user-id-1');
      expect(mockAuthRepo.revokeAllUserSessions).toHaveBeenCalledWith('user-id-1');
      expect(result.message).toContain('all devices');
    });
  });

  describe('verifyEmail', () => {
    it('should activate user on valid token', async () => {
      mockAuthRepo.verifyEmailToken.mockResolvedValue({ success: true });
      const result = await service.verifyEmail({ token: 'valid_token' });
      expect(result.message).toContain('Email successfully verified');
    });

    it('should throw BadRequestException on invalid or expired token', async () => {
      mockAuthRepo.verifyEmailToken.mockResolvedValue({
        success: false,
        reason: 'Verification token has expired',
      });
      await expect(service.verifyEmail({ token: 'expired_token' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('password reset & change', () => {
    it('should handle forgot password and send email if user exists', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'user@courtly.app',
        fullName: 'User Name',
      });
      const result = await service.forgotPassword({ email: 'user@courtly.app' });
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result.message).toContain('instructions have been sent');
    });

    it('should return generic message on forgot password even if user does not exist', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);
      const result = await service.forgotPassword({ email: 'unknown@courtly.app' });
      expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(result.message).toContain('instructions have been sent');
    });

    it('should reset password with valid token and revoke sessions', async () => {
      mockAuthRepo.resetPasswordWithToken.mockResolvedValue({ success: true });
      const result = await service.resetPassword({
        token: 'reset_token',
        newPassword: 'BrandNewPassword123!',
      });
      expect(result.message).toContain('successfully reset');
    });

    it('should change password when current password matches', async () => {
      mockAuthRepo.findUserById.mockResolvedValue({
        id: 'u-1',
        passwordHash: 'current_hash',
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockAuthRepo.updatePasswordAndRevokeSessions.mockResolvedValue(undefined);

      const result = await service.changePassword('u-1', {
        currentPassword: 'CurrentPassword!',
        newPassword: 'BrandNewPassword123!',
      });
      expect(result.message).toContain('successfully changed');
    });
  });
});
