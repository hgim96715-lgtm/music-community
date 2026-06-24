import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from './config/env.keys';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: [
      'http://localhost:3031',
      configService.get<string>(EnvKeys.FRONTEND_URL),
    ].filter(Boolean),
    credentials: true,
  });
  await app.listen(configService.get<number>(EnvKeys.PORT) ?? 3030);
}
bootstrap();
