import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: '노래가 좋아' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nickname?: string;

  @ApiPropertyOptional({ example: '안녕하세요, 저는 노래가 좋아요.' })
  @IsOptional()
  @IsString()
  bio?: string;
}
