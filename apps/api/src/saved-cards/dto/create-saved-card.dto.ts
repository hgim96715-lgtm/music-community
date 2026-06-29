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

class SavedCardCustomizationDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => SavedCardDisplayDto)
  display?: SavedCardDisplayDto;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  background?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  layout?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  frame?: string;

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
