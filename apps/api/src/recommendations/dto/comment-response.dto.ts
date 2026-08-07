import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorSnippetDto } from 'src/common/dto/author-snippet.dto';

export class CommentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  recommendationId: string;

  @ApiProperty({ format: 'uuid' })
  authorId: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  parentId: string | null;

  @ApiPropertyOptional({ nullable: true })
  deletedAt: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ type: AuthorSnippetDto })
  author: AuthorSnippetDto;
}
