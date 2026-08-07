import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorSnippetDto } from 'src/common/dto/author-snippet.dto';
import { ReactionResponseDto } from './reaction-response.dto';

class RecommendationCommentCountDto {
  @ApiProperty()
  comments: number;
}

export class RecommendationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  artist: string;

  @ApiProperty()
  embedUrl: string;

  @ApiProperty()
  reason: string;

  @ApiProperty({ type: [String] })
  moods: string[];

  @ApiProperty()
  hidden: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ format: 'uuid' })
  authorId: string;

  @ApiProperty({ type: AuthorSnippetDto })
  author: AuthorSnippetDto;

  @ApiProperty({ type: [ReactionResponseDto] })
  reactions: ReactionResponseDto[];

  @ApiPropertyOptional({ type: RecommendationCommentCountDto })
  _count?: RecommendationCommentCountDto;
}

export class RecommendationsPageDto {
  @ApiProperty({ type: [RecommendationResponseDto] })
  items: RecommendationResponseDto[];

  @ApiProperty({ nullable: true, format: 'uuid' })
  nextCursor: string | null;
}
