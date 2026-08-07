/**
 * Nest AppModule을 띄워 Swagger document → apps/web/openapi/openapi.json
 *
 *   pnpm --filter api dump:openapi
 *   (루트) pnpm gen:api
 *
 * apps/api/.env DATABASE_URL 필요 (Prisma $connect).
 */
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';

async function main() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

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
  const outDir = path.resolve(process.cwd(), '../web/openapi');
  const outFile = path.join(outDir, 'openapi.json');
  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  console.log(`wrote ${outFile}`);
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
