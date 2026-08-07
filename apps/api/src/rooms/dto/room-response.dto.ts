import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorSnippetDto } from 'src/common/dto/author-snippet.dto';

export class RoomResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ type: [String] })
  topicTags: string[];

  @ApiProperty({ enum: ['public', 'private', 'invite'] })
  visibility: 'public' | 'private' | 'invite';

  @ApiPropertyOptional({ nullable: true })
  passwordHint: string | null;

  @ApiProperty({ enum: ['active', 'closed', 'archived'] })
  status: 'active' | 'closed' | 'archived';

  @ApiProperty()
  memberCount: number;

  @ApiProperty({ format: 'uuid' })
  ownerId: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ type: AuthorSnippetDto })
  owner: AuthorSnippetDto;

  /** `/rooms/mine`만 */
  @ApiPropertyOptional({ nullable: true })
  lastMessageAt?: string | null;

  @ApiPropertyOptional()
  lastReadAt?: string;

  @ApiPropertyOptional()
  unread?: boolean;
}

export class RoomChatThemeResponseDto {
  @ApiProperty()
  presetId: string;

  @ApiPropertyOptional({ nullable: true })
  backgroundUrl: string | null;
}

class RoomMessageSenderDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nickname: string;

  @ApiPropertyOptional({ nullable: true })
  image?: string | null;
}

class RoomMessageRecommendationDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  artist: string;

  @ApiProperty()
  embedUrl: string;

  @ApiProperty({ type: [String] })
  moods: string[];

  @ApiProperty()
  reason: string;

  @ApiProperty()
  createdAt: string;
}

class RoomMessageReactionDto {
  @ApiProperty()
  emoji: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  createdAt: string;
}

/** 메시지 목록 — nested는 스키마 노출용 단순화 */
export class RoomMessageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  roomId: string;

  @ApiProperty({ format: 'uuid' })
  senderId: string;

  @ApiProperty({
    enum: ['text', 'recommendation', 'saved_card', 'lyric_quote', 'system'],
  })
  type: string;

  @ApiPropertyOptional({ nullable: true })
  body: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  recommendationId: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiPropertyOptional({ nullable: true })
  deletedAt: string | null;

  @ApiProperty()
  deletedByOwner: boolean;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  deletedById?: string | null;

  @ApiProperty({ type: RoomMessageSenderDto })
  sender: RoomMessageSenderDto;

  @ApiPropertyOptional({ nullable: true, type: RoomMessageRecommendationDto })
  recommendation: RoomMessageRecommendationDto | null;

  @ApiPropertyOptional({ nullable: true })
  savedCard: object | null;

  @ApiPropertyOptional({ nullable: true })
  lyricStartSec: number | null;

  @ApiPropertyOptional({ nullable: true })
  lyricEndSec: number | null;

  @ApiPropertyOptional({ type: [RoomMessageReactionDto] })
  reactions?: RoomMessageReactionDto[];

  @ApiPropertyOptional({ nullable: true })
  replyTo?: object | null;
}
