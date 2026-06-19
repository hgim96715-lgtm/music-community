import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { RecommendationsModule } from './recommendations/recommendations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema:  envValidationSchema,
      validationOptions: { convert: true },
    }),
    PrismaModule,
    RecommendationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
