import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { PasswordService } from './services/password.service.js';
import { TokenService } from './services/token.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AuthRateLimitGuard } from '../common/guards/auth-rate-limit.guard.js';
import { MailModule } from '../mail/mail.module.js';
import { RolesModule } from '../roles/roles.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    MailModule,
    RolesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    PasswordService,
    TokenService,
    JwtStrategy,
    JwtAuthGuard,
    AuthRateLimitGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    TokenService,
    PasswordService,
    PassportModule,
  ],
})
export class AuthModule {}
