import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorSnippetDto } from 'src/common/dto/author-snippet.dto';

export class NotificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ enum: ['comment_reply'] })
  type: 'comment_reply';

  @ApiProperty({ format: 'uuid' })
  recommendationId: string;

  @ApiProperty({ format: 'uuid' })
  commentId: string;

  @ApiProperty({ format: 'uuid' })
  actorId: string;

  @ApiPropertyOptional({ nullable: true })
  readAt: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: AuthorSnippetDto })
  actor: AuthorSnippetDto;
}
