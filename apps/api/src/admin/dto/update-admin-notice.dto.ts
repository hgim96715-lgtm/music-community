import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAdminNoticeDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({ description: 'true 게시 · false 숨김' })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
