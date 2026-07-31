import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class OpenDmDto {
  @ApiProperty({ description: '상대 userId' })
  @IsUUID()
  otherUserId!: string;
}
