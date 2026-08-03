import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListAdminRoomsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  q?: string;

  @IsOptional()
  @IsIn(['active', 'closed', 'archived'])
  status?: 'active' | 'closed' | 'archived';

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
