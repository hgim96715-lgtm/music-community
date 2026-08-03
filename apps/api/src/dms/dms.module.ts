import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { DmsController } from './dms.controller';
import { DmsService } from './dms.service';
import { DmsEventsGateway } from './dms-events.gateway';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [DmsController],
  providers: [DmsService, DmsEventsGateway],
  exports: [DmsService],
})
export class DmsModule {}
