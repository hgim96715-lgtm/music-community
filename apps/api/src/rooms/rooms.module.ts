import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomsEventsGateway } from './rooms-events.gateway';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsEventsGateway],
  exports: [RoomsService],
})
export class RoomsModule {}
