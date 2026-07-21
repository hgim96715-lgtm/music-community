// apps/api/src/saved-lyrics/saved-lyrics.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { SavedLyricsController } from './saved-lyrics.controller';
import { SavedLyricsService } from './saved-lyrics.service';

@Module({
  imports: [AuthModule],
  controllers: [SavedLyricsController],
  providers: [SavedLyricsService],
})
export class SavedLyricsModule {}
