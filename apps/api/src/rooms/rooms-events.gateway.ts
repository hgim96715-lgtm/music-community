import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { AuthedSocket } from 'src/realtime/authed-socket';
import { RoomsService } from './rooms.service';

/** 방 join/leave만. 연결·emit → ChatGateway */
@WebSocketGateway({ namespace: '/chat' })
export class RoomsEventsGateway {
  constructor(private readonly roomsService: RoomsService) {}

  @SubscribeMessage('join')
  async onJoin(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !body?.roomId) {
      return { ok: false };
    }
    await this.roomsService.listMessages(body.roomId, userId);
    await client.join(`room:${body.roomId}`);
    return { ok: true, roomId: body.roomId };
  }

  @SubscribeMessage('leave')
  async onLeave(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { roomId: string },
  ) {
    if (!body?.roomId) return { ok: false };
    await client.leave(`room:${body.roomId}`);
    return { ok: true, roomId: body.roomId };
  }
}
