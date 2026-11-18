export interface AppConfig {
  nodeEnv: string;
  port: number;
  host: string;
  redisUrl: string;
  databaseUrl?: string;
  directUrl?: string;
  jwtAccessSecret: string;
  jwtAccessExpiresIn: string;
  refreshTokenTtlDays: number;
  resendApiKey?: string;
  emailFrom: string;
  appDeepLinkScheme: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT || '4000', 10),
  host: process.env.API_HOST || '0.0.0.0',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET ||
    'courtly_super_secure_jwt_access_secret_key_2026_dev_mode',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10),
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM || 'Courtly <onboarding@resend.dev>',
  appDeepLinkScheme: process.env.APP_DEEP_LINK_SCHEME || 'courtly',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
});
