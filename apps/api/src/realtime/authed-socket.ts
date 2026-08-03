import type { Socket } from 'socket.io';

export type AuthedSocket = Socket & { data: { userId?: string } };
