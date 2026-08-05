import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListAdminReportsQueryDto {
  @IsOptional()
  @IsIn(['pending', 'resolved', 'dismissed'])
  status?: 'pending' | 'resolved' | 'dismissed';

  @IsOptional()
  @IsIn(['comment', 'room_message', 'recommendation'])
  targetType?: 'comment' | 'room_message' | 'recommendation';

  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
