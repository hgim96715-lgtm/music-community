import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** 카드에 무엇을 보일지 — 값은 Recommendation / SavedCard에서 읽음 */
class SavedCardDisplayDto {
  @IsOptional()
  @IsBoolean()
  title?: boolean;

  @IsOptional()
  @IsBoolean()
  artist?: boolean;

  @IsOptional()
  @IsBoolean()
  reason?: boolean;

  @IsOptional()
  @IsBoolean()
  moods?: boolean;

  /** 추천 올린 날 — `Recommendation.createdAt` */
  @IsOptional()
  @IsBoolean()
  postedAt?: boolean;

  /** 앨범에 저장한 날 — `SavedCard.createdAt` */
  @IsOptional()
  @IsBoolean()
  savedAt?: boolean;
}

class SavedCardStickerDto {
  @IsString()
  @MaxLength(64)
  assetId: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  y: number;

  @IsNumber()
  rotation: number;

  @IsNumber()
  @Min(0.1)
  @Max(3)
  scale: number;
}

class SavedCardTextColorsDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  artist?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  moods?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  postedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  savedAt?: string;
}

export class SavedCardCustomizationDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => SavedCardDisplayDto)
  display?: SavedCardDisplayDto;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  background?: string;

  /** data URL 또는 https — 투명 PNG·WebP 권장 · `background` 색 위에 덮음 */
  @IsOptional()
  @IsString()
  @MaxLength(350000)
  backgroundImage?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  backgroundImageOpacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  layout?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  frame?: string;

  /** music-strip — 하단 플레이어 바 배경 */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  playerBar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  textColor?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SavedCardTextColorsDto)
  textColors?: SavedCardTextColorsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SavedCardStickerDto)
  stickers?: SavedCardStickerDto[];
}

export class CreateSavedCardDto {
  @ApiProperty({ description: '저장할 Recommendation ID' })
  @IsUUID()
  recommendationId: string;

  @ApiProperty({
    example: {
      display: {
        title: true,
        artist: true,
        reason: true,
        moods: false,
        postedAt: true,
        savedAt: false,
      },
      background: '#f0e6ff',
      layout: 'poster',
      frame: 'neobrutal',
      stickers: [{ assetId: 'star', x: 0.2, y: 0.1, rotation: 12, scale: 1 }],
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => SavedCardCustomizationDto)
  customization: SavedCardCustomizationDto;
}
