import { io, type Socket } from 'socket.io-client';
import { getApiAccessToken } from './authToken';
import { getApiBaseUrl } from './fetchApi';
import type { ApiRoomMessage } from './rooms';

let socket: Socket | null = null;

export function getRoomSocket(): Socket {
  if (socket?.connected) return socket;
  const token = getApiAccessToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  if (!socket) {
    socket = io(`${getApiBaseUrl()}/chat`, {
      autoConnect: false,
      auth: { token },
      withCredentials: true,
    });
  } else {
    socket.auth = { token };
  }
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectRoomSocket() {
  socket?.disconnect();
  socket = null;
}

/** 소켓 룸 입장 (REST join 후 호출) */
export function socketJoinRoom(roomId: string): Promise<{ ok: boolean }> {
  const s = getRoomSocket();
  return new Promise((resolve) => {
    s.emit('join', { roomId }, (res: { ok: boolean }) => resolve(res));
  });
}

export function socketLeaveRoom(roomId: string): Promise<{ ok: boolean }> {
  const s = getRoomSocket();
  return new Promise((resolve) => {
    s.emit('leave', { roomId }, (res: { ok: boolean }) => resolve(res));
  });
}

export function onRoomMessage(
  handler: (message: ApiRoomMessage) => void,
): () => void {
  const s = getRoomSocket();
  s.on('message', handler);
  return () => s.off('message', handler);
}

export function onRoomMessageDeleted(
  handler: (payload: { messageId: string }) => void,
): () => void {
  const s = getRoomSocket();
  s.on('message:deleted', handler);
  return () => {
    s.off('message:deleted', handler);
  };
}
