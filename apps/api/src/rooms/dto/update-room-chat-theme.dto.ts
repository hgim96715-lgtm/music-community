import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const ROOM_THEME_PRESETS = [
  'lp-bar',
  'cream-paper',
  'midnight',
  'fan-pink',
] as const;

export class UpdateRoomChatThemeDto {
  @ApiPropertyOptional({ enum: ROOM_THEME_PRESETS })
  @IsOptional()
  @IsIn([...ROOM_THEME_PRESETS])
  presetId?: (typeof ROOM_THEME_PRESETS)[number];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(2048)
  backgroundUrl?: string | null;
}
