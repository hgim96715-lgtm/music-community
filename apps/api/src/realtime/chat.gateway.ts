import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import { EnvKeys } from 'src/config/env.keys';
import type { JwtPayload } from 'src/auth/jwt-payload';
import type { AuthedSocket } from './authed-socket';

/** 연결·방송만. join/leave는 RoomsEventsGateway / DmsEventsGateway */
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
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
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

  /** REST로 저장된 메시지를 방 소켓에 전파 */
  emitMessage(roomId: string, message: unknown) {
    this.server.to(`room:${roomId}`).emit('message', message);
  }

  /** 전체에서 삭제된 메시지 */
  emitMessageDeleted(roomId: string, message: unknown) {
    this.server.to(`room:${roomId}`).emit('message:deleted', message);
  }

  /** 강퇴 — 대상 유저 소켓만 */
  emitMemberKicked(roomId: string, targetUserId: string) {
    this.server.to(`user:${targetUserId}`).emit('room:kicked', { roomId });
  }

  /** 방 설정 변경 (공지 등) */
  emitRoomUpdated(
    roomId: string,
    patch: {
      description: string | null;
      name: string;
      topicTags: string[];
      updatedAt: string;
    },
  ) {
    this.server.to(`room:${roomId}`).emit('room:updated', { roomId, ...patch });
  }

  /** 탭백 */
  emitMessageReaction(
    roomId: string,
    payload: {
      messageId: string;
      userId: string;
      emoji: string;
      removed: boolean;
    },
  ) {
    this.server.to(`room:${roomId}`).emit('message:reaction', payload);
  }

  emitDmMessage(dmId: string, message: unknown) {
    this.server.to(`dm:${dmId}`).emit('dm:message', message);
  }

  emitDmAccepted(requesterUserId: string, dmId: string) {
    this.server.to(`user:${requesterUserId}`).emit('dm:accepted', { dmId });
  }

  emitDmUnread(userId: string, payload: { dmId: string; unread: boolean }) {
    this.server.to(`user:${userId}`).emit('dm:unread', payload);
  }

  emitRoomUnread(
    userId: string,
    payload: { roomId: string; unread: boolean },
  ) {
    this.server.to(`user:${userId}`).emit('room:unread', payload);
  }
}
