import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RoomVisibility } from 'src/generated/prisma/enums';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name: string;
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
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

  @IsOptional()
  @IsString()
  @MaxLength(64)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  passwordHint?: string;
}
