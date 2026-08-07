import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** 피드·댓글·알림 actor — id·nickname 필수 · image는 include에 따라 생략 가능 */
export class AuthorSnippetDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nickname: string;

  @ApiPropertyOptional({ nullable: true })
  image?: string | null;
}
