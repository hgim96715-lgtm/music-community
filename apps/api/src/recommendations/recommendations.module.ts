import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule,AuthModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
