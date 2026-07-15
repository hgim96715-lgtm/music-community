import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { RoomMessageType } from 'src/generated/prisma/enums';

export class CreateRoomMessageDto {
  @IsEnum(RoomMessageType)
  type: RoomMessageType;

  @ValidateIf((o: CreateRoomMessageDto) => o.type === RoomMessageType.text)
  @IsString()
  @MaxLength(2000)
  body?: string;

  @ValidateIf(
    (o: CreateRoomMessageDto) => o.type === RoomMessageType.recommendation,
  )
  @IsUUID()
  recommendationId?: string;
}
