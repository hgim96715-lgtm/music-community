import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAdminNoticeDto {
  @ApiProperty({ example: '서비스 점검 안내' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: '내일 02:00~04:00 점검이 있어요.' })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body!: string;

  @ApiPropertyOptional({ description: 'true면 바로 게시', default: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
