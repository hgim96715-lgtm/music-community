import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { AuthedSocket } from 'src/realtime/authed-socket';
import { DmsService } from './dms.service';

/** DM join/leave만. 연결·emit → ChatGateway */
@WebSocketGateway({ namespace: '/chat' })
export class DmsEventsGateway {
  constructor(private readonly dmsService: DmsService) {}

  @SubscribeMessage('dm:join')
  async onDmJoin(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { dmId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !body?.dmId) return { ok: false };
    try {
      await this.dmsService.listMessages(body.dmId, userId);
    } catch {
      return { ok: false };
    }
    await client.join(`dm:${body.dmId}`);
    return { ok: true, dmId: body.dmId };
  }

  @SubscribeMessage('dm:leave')
  async onDmLeave(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { dmId: string },
  ) {
    if (!body?.dmId) return { ok: false };
    await client.leave(`dm:${body.dmId}`);
    return { ok: true, dmId: body.dmId };
  }
}
