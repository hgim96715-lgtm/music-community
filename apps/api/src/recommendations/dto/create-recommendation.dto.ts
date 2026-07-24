import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  ValidateBy,
} from 'class-validator';

import { isValidMood, MAX_MOODS, MIN_MOODS } from '../constants/moods';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 안 넣음: id · hidden · createdAt
 * → forbidNonWhitelisted 가 켜져 있어 body 에 섞여 와도 400으로 차단됨
 */

export class CreateRecommendationDto {
  /** 곡 제목 */
  @IsString()
  @IsNotEmpty()
  title: string;

  /** 아티스트 이름 */
  @IsString()
  @IsNotEmpty()
  artist: string;

  /** YouTube / Spotify embed URL (http·https) */
  @IsString()
  @IsUrl(
    {
      require_protocol: true,
      require_tld: false,
      protocols: ['http', 'https'],
    },
    { message: 'http(s):// 를 포함한 전체 주소를 입력해주세요.' },
  )
  @IsNotEmpty()
  embedUrl: string;

  /** 추천 이유 (최대 200자) */
  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  reason: string;

  /** 무드 1~3개 — 프리셋 + free-text (길이만) */
  @ApiProperty({
    type: [String],
    minItems: MIN_MOODS,
    maxItems: MAX_MOODS,
    example: ['새벽', '출퇴근'],
  })
  @IsArray()
  @ArrayMinSize(MIN_MOODS)
  @ArrayMaxSize(MAX_MOODS)
  @IsString({ each: true })
  @ValidateBy(
    {
      name: 'isMood',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isValidMood(value),
        defaultMessage: () => '무드는 1~8자로 입력해주세요.',
      },
    },
    { each: true },
  )
  moods: string[];
}
