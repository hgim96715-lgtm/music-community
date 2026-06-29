import { Module } from '@nestjs/common';
import { SavedCardsService } from './saved-cards.service';
import { SavedCardsController } from './saved-cards.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SavedCardsController],
  providers: [SavedCardsService],
})
export class SavedCardsModule {}
