import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from './config/env.keys';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { formatValidationMessages } from './common/validation-messages';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: '600kb' });
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>(EnvKeys.FRONTEND_URL);
  const frontendOrigin = frontendUrl
    ? new URL(frontendUrl).origin
    : undefined;
  app.enableCors({
    origin: frontendOrigin
      ? [
          'http://localhost:3031',
          'http://127.0.0.1:3031',
          frontendOrigin,
        ]
      : undefined,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) =>
        new BadRequestException(formatValidationMessages(errors)),
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Music Community API')
    .setDescription('Music Community API description')
    .setVersion('0.0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'POST /auth/login 또는 /auth/register 후 발급받은 토큰을 사용하세요.',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(configService.get<number>(EnvKeys.PORT) ?? 3030);
}
bootstrap();
