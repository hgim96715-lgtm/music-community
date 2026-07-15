import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RoomVisibility } from 'src/generated/prisma/enums';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  topicTags?: string[];

  @IsOptional()
  @IsEnum(RoomVisibility)
  visibility?: RoomVisibility;
}
