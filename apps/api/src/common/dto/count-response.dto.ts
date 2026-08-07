import { ApiProperty } from '@nestjs/swagger';

export class CountResponseDto {
  @ApiProperty()
  count: number;
}
