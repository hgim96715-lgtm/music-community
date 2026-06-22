import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAdminRecommendationDto {
  /** true: 숨김, false: 공개 */
  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}
