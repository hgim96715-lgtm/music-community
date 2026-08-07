import { ApiProperty } from '@nestjs/swagger';

export class ReactionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  recommendationId: string;

  @ApiProperty({ example: 'like' })
  type: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
