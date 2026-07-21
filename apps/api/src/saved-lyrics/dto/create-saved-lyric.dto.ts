import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSavedLyricDto {
  @ApiProperty({ description: '듣고 있던 Recommendation ID' })
  @IsUUID()
  recommendationId: string;

  @ApiProperty({ description: '가사 소절' })
  @IsString()
  @MaxLength(2000)
  lyricsText: string;

  @ApiPropertyOptional({ description: '그때의 메모·감정 (선택)' })
  @IsOptional()
  @IsString()
  @MaxLength(800)
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  startSec?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  endSec?: number;
}
