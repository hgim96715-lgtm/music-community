import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { IsOptional } from 'class-validator';

export class UpdateAdminRecommendationDto {
  @ApiPropertyOptional({ description: 'true면 피드에서 숨기기' })
  @IsBoolean()
  @IsOptional()
  hidden?: boolean;
}
