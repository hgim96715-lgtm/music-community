import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

import { MAX_MOODS, MIN_MOODS, MOOD_VALUES } from '../constants/moods';

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

  /** 분위기 1~3개 — MOODS 단일 소스 */
  @IsArray()
  @ArrayMinSize(MIN_MOODS)
  @ArrayMaxSize(MAX_MOODS)
  @IsIn(MOOD_VALUES, { each: true })
  moods: string[];
}
