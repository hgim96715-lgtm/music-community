import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListRecommendationsQueryDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  /**
   * recent = KST 최근 7일 · older = 그 이전 · all = 전체(기본)
   * 피드 home/더보기 · 공유 시트는 all
   */
  @IsOptional()
  @IsIn(['recent', 'older', 'all'])
  scope?: 'recent' | 'older' | 'all';
}
