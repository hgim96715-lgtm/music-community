import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendDmMessageDto {
  @ApiProperty({ description: '메시지 내용' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}
