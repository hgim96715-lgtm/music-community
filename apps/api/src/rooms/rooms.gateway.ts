import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { EnvKeys } from 'src/config/env.keys';
import type { JwtPayload } from 'src/auth/jwt-payload';
import { RoomsService } from './rooms.service';

type AuthedSocket = Socket & { data: { userId?: string } };

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3031',
      'http://127.0.0.1:3031',
      process.env.FRONTEND_URL
        ? new URL(process.env.FRONTEND_URL).origin
        : undefined,
    ].filter(Boolean),
    credentials: true,
  },
  namespace: '/chat',
})
export class RoomsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly roomsService: RoomsService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.query?.token as string | undefined);

      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow(EnvKeys.API_JWT_SECRET),
      });
      client.data.userId = payload.sub;
      await client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }
  @SubscribeMessage('join')
  async onJoin(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !body.roomId) {
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

  /** REST로 저장된 메시지를 방 소켓에 전파 */
  emitMessage(roomId: string, message: unknown) {
    this.server.to(`room:${roomId}`).emit('message', message);
  }

  /** 전체에서 삭제된 메시지 */
  emitMessageDeleted(roomId: string, messageId: string) {
    this.server.to(`room:${roomId}`).emit('message:deleted', { messageId });
  }
  /** 강퇴 — 대상 유저 소켓만 (방 전체에 뿌리지 않음) */
  emitMemberKicked(roomId: string, targetUserId: string) {
    this.server.to(`user:${targetUserId}`).emit('room:kicked', { roomId });
  }
}
