import { ApiProperty } from '@nestjs/swagger';

export class AvailableResponseDto {
  @ApiProperty()
  available: boolean;
}
