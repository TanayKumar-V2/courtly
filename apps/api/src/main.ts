import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT') || 4000;
  const host = configService.get<string>('API_HOST') || '0.0.0.0';

  // Security headers with Helmet
  app.use(helmet());

  // CORS configuration for mobile and local development
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Route Prefix
  app.setGlobalPrefix('api');

  // Global validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Centralized exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Structured request logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(port, host);
  logger.log(`Courtly NestJS API listening at http://${host}:${port}/api`);
}

bootstrap();
