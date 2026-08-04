import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { RoomStatus } from 'src/generated/prisma/enums';

export class UpdateAdminRoomDto {
  @ApiPropertyOptional({ enum: ['active', 'closed', 'archived'] })
  @IsOptional()
  @IsIn(['active', 'closed', 'archived'])
  status: RoomStatus;

  @ApiPropertyOptional({ description: '방장 통지용 사유 · 닫기·보관 시 필수' })
  @ValidateIf(
    (o: UpdateAdminRoomDto) => o.status === 'closed' || o.status === 'archived',
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;
}
