import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { UserRole } from 'src/generated/prisma/enums';

export class ListAdminUsersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  inactiveDays?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeToday?: boolean;

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
