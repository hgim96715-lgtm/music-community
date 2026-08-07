import { io, type Socket } from 'socket.io-client';
import { getApiAccessToken } from './authToken';
import { getApiBaseUrl } from './api/fetchApi';
import type { ApiRoomMessage, ToogleRoomMessageReactionResult } from './api/rooms';
import { ApiDmMessage } from './api/dms';

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
    const doJoin = () => {
      s.emit('join', { roomId }, (res: { ok: boolean }) =>
        resolve(res ?? { ok: false }),
      );
    };
    if (s.connected) doJoin();
    else s.once('connect', doJoin);
  });
}

export function onRoomSocketConnect(handler: () => void): () => void {
  const s = getRoomSocket();
  s.on('connect', handler);
  return () => {
    s.off('connect', handler);
  };
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
  handler: (payload: ApiRoomMessage) => void,
): () => void {
  const s = getRoomSocket();
  s.on('message:deleted', handler);
  return () => {
    s.off('message:deleted', handler);
  };
}

export function onRoomKicked(
  handler: (payload: { roomId: string }) => void,
): () => void {
  const s = getRoomSocket();
  s.on('room:kicked', handler);
  return () => {
    s.off('room:kicked', handler);
  };
}

export type RoomUpdatedPayload = {
  roomId: string;
  description: string | null;
  name: string;
  topicTags: string[];
  updatedAt: string;
};

export function onRoomUpdated(
  handler: (payload: RoomUpdatedPayload) => void,
): () => void {
  const s = getRoomSocket();
  s.on('room:updated', handler);
  return () => {
    s.off('room:updated', handler);
  };
}

export function onRoomMessageReaction(
  handler: (payload: ToogleRoomMessageReactionResult) => void,
): () => void {
  const s = getRoomSocket();
  s.on('message:reaction', handler);
  return () => {
    s.off('message:reaction', handler);
  };
}

export function socketJoinDm(dmId: string): Promise<{ ok: boolean }> {
  const s = getRoomSocket();
  return new Promise((resolve) => {
    const doJoin = () => {
      s.emit('dm:join', { dmId }, (res: { ok: boolean }) =>
        resolve(res ?? { ok: false }),
      );
    };
    if (s.connected) doJoin();
    else s.once('connect', doJoin);
  });
}

export function socketLeaveDm(dmId: string): Promise<{ ok: boolean }> {
  const s = getRoomSocket();
  return new Promise((resolve) => {
    s.emit('dm:leave', { dmId }, (res: { ok: boolean }) =>
      resolve(res ?? { ok: false }),
    );
  });
}

export function onDmMessage(
  handler: (message: ApiDmMessage) => void,
): () => void {
  const s = getRoomSocket();
  s.on('dm:message', handler);
  return () => {
    s.off('dm:message', handler);
  };
}

export function onDmAccepted(handler: (dmId: string) => void): () => void {
  const s = getRoomSocket();
  s.on('dm:accepted', handler);
  return () => {
    s.off('dm:accepted', handler);
  };
}

export function onDmUnread(
  handler: (payload: { dmId: string; unread: boolean }) => void,
): () => void {
  const s = getRoomSocket();
  s.on('dm:unread', handler);
  return () => {
    s.off('dm:unread', handler);
  };
}

export function onRoomUnread(
  handler: (payload: { roomId: string; unread: boolean }) => void,
): () => void {
  const s = getRoomSocket();
  s.on('room:unread', handler);
  return () => {
    s.off('room:unread', handler);
  };
}
