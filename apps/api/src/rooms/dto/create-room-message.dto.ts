import {
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { RoomMessageType } from 'src/generated/prisma/enums';

export class CreateRoomMessageDto {
  @IsEnum(RoomMessageType)
  type: RoomMessageType;

  @ValidateIf(
    (o: CreateRoomMessageDto) =>
      o.type === RoomMessageType.text || o.type === RoomMessageType.lyric_quote,
  )
  @IsString()
  @MaxLength(2000)
  body?: string;

  @ValidateIf(
    (o: CreateRoomMessageDto) =>
      o.type === RoomMessageType.recommendation ||
      o.type === RoomMessageType.lyric_quote,
  )
  @IsUUID()
  recommendationId?: string;

  @ValidateIf((o) => o.type === RoomMessageType.saved_card)
  @IsUUID()
  savedCardId?: string;

  @ValidateIf((o) => o.type === RoomMessageType.lyric_quote)
  @IsInt()
  @Min(0)
  lyricStartSec?: number;

  @ValidateIf((o) => o.type === RoomMessageType.lyric_quote)
  @IsInt()
  @Min(0)
  lyricEndSec?: number;
}
