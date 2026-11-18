import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null = null;
  private readonly fromEmail: string;
  private readonly deepLinkScheme: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('RESEND_API_KEY') ||
      process.env.RESEND_API_KEY;
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') ||
      'Courtly <onboarding@resend.dev>';
    this.deepLinkScheme =
      this.configService.get<string>('APP_DEEP_LINK_SCHEME') || 'courtly';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email client initialized');
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Running in Development Mail Logger mode.',
      );
    }
  }

  async sendVerificationEmail(
    toEmail: string,
    token: string,
    fullName: string,
  ): Promise<void> {
    const deepLink = `${this.deepLinkScheme}://verify-email?token=${token}`;

    if (!this.resend) {
      this.logger.log(
        `\n========================================================\n[DEV MAIL LOGGER] EMAIL VERIFICATION\nTo: ${toEmail} (${fullName})\nDeep Link: ${deepLink}\nToken: ${token}\nExpires in: 24 hours\n========================================================\n`,
      );
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject: 'Verify your Courtly account',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #121214; color: #FFFFFF; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #C6F36B; margin-bottom: 20px; font-size: 28px;">Welcome to Courtly!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #E4E4E7;">Hi ${fullName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #E4E4E7;">Thank you for registering. Please open the link below to verify your email address:</p>
            <div style="margin: 32px 0;">
              <a href="${deepLink}" style="background-color: #C6F36B; color: #121214; font-weight: 700; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email</a>
            </div>
            <p style="font-size: 13px; color: #A1A1AA; word-break: break-all;">Direct Link: <a href="${deepLink}" style="color: #C6F36B;">${deepLink}</a></p>
            <p style="font-size: 13px; color: #71717A; margin-top: 30px;">If you did not request this account, please disregard this email.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${toEmail}`, error);
    }
  }

  async sendPasswordResetEmail(
    toEmail: string,
    token: string,
    fullName: string,
  ): Promise<void> {
    const deepLink = `${this.deepLinkScheme}://reset-password?token=${token}`;

    if (!this.resend) {
      this.logger.log(
        `\n========================================================\n[DEV MAIL LOGGER] PASSWORD RESET\nTo: ${toEmail} (${fullName})\nDeep Link: ${deepLink}\nToken: ${token}\nExpires in: 15 minutes\n========================================================\n`,
      );
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject: 'Reset your Courtly password',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #121214; color: #FFFFFF; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #C6F36B; margin-bottom: 20px; font-size: 28px;">Password Reset Request</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #E4E4E7;">Hi ${fullName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #E4E4E7;">We received a request to reset your password. Tap the button below to choose a new password:</p>
            <div style="margin: 32px 0;">
              <a href="${deepLink}" style="background-color: #C6F36B; color: #121214; font-weight: 700; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 13px; color: #A1A1AA; word-break: break-all;">Direct Link: <a href="${deepLink}" style="color: #C6F36B;">${deepLink}</a></p>
            <p style="font-size: 13px; color: #71717A; margin-top: 30px;">This link will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${toEmail}`,
        error,
      );
    }
  }
}
