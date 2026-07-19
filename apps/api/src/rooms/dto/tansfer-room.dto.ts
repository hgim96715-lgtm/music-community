import { IsUUID } from 'class-validator';

export class TransfreRoomDto {
  /** 새 방장 — 이미 그 방 멤버 */
  @IsUUID()
  userId!: string;
}
