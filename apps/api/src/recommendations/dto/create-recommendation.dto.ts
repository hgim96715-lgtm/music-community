import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export const MOODS = [
  '새벽',
  '운전',
  '집중',
  '운동',
  '비',
  '설렘',
  '우울',
  '파티',
  '힐링',
  '그리움',
] as const;

export class CreateRecommendationDto {
  /** 곡 제목 */
  @IsString()
  @IsNotEmpty()
  title: string;

  /** 아티스트 */
  @IsString()
  @IsNotEmpty()
  artist: string;

  /** YouTube / Spotify / Apple Music embed URL */
  @IsString()
  @IsNotEmpty()
  embedUrl: string;

  /** 추천 이유 */
  @IsString()
  @IsNotEmpty()
  reason: string;

  /** 분위기 태그 (1~3개) */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsIn(MOODS, { each: true })
  moods: string[];
}
