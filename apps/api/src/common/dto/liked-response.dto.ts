import { ApiProperty } from '@nestjs/swagger';

export class LikedResponseDto {
  @ApiProperty({ example: true })
  liked: true;
}
