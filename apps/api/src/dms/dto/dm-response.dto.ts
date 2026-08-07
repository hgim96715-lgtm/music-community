import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorSnippetDto } from 'src/common/dto/author-snippet.dto';

class DmLastMessageDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ format: 'uuid' })
  senderId: string;

  @ApiProperty()
  createdAt: string;
}

export class DmListItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ['pending', 'open', 'declined'] })
  status: 'pending' | 'open' | 'declined';

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional({ nullable: true, type: AuthorSnippetDto })
  other: AuthorSnippetDto | null;

  @ApiPropertyOptional({ nullable: true, type: DmLastMessageDto })
  lastMessage: DmLastMessageDto | null;

  @ApiProperty()
  unread: boolean;
}

export class DmDetailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ['pending', 'open', 'declined'] })
  status: 'pending' | 'open' | 'declined';

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  requestedById: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional({ nullable: true, type: AuthorSnippetDto })
  other: AuthorSnippetDto | null;
}

export class DmMessageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  dmId: string;

  @ApiProperty({ format: 'uuid' })
  senderId: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ type: AuthorSnippetDto })
  sender: AuthorSnippetDto;
}

export class DmRequestItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ['pending', 'open', 'declined'] })
  status: 'pending' | 'open' | 'declined';

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  requestedById: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiPropertyOptional({ nullable: true, type: AuthorSnippetDto })
  other: AuthorSnippetDto | null;
}
