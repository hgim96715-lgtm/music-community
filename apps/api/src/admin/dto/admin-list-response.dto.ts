import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AdminRoomOwnerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  email: string;
}

export class AdminRoomResponseDto {
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

  @ApiProperty({ enum: ['active', 'closed', 'archived'] })
  status: 'active' | 'closed' | 'archived';

  @ApiProperty()
  memberCount: number;

  @ApiPropertyOptional({ nullable: true })
  passwordHint: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ format: 'uuid' })
  ownerId: string;

  @ApiProperty({ type: AdminRoomOwnerDto })
  owner: AdminRoomOwnerDto;
}

export class AdminRoomsPageDto {
  @ApiProperty({ type: [AdminRoomResponseDto] })
  items: AdminRoomResponseDto[];

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  nextCursor: string | null;
}

class AdminUserCountsDto {
  @ApiProperty()
  recommendations: number;

  @ApiProperty()
  reactions: number;

  @ApiProperty()
  savedCards: number;
}

export class AdminUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ enum: ['user', 'admin'] })
  role: 'user' | 'admin';

  @ApiProperty()
  createdAt: string;

  @ApiPropertyOptional({ nullable: true })
  lastActiveAt: string | null;

  @ApiProperty({ type: AdminUserCountsDto })
  _count: AdminUserCountsDto;
}

export class AdminUsersPageDto {
  @ApiProperty({ type: [AdminUserResponseDto] })
  items: AdminUserResponseDto[];

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  nextCursor: string | null;
}

class AdminReportReporterDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  email: string;
}

export class AdminReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ['comment', 'room_message', 'recommendation'] })
  targetType: 'comment' | 'room_message' | 'recommendation';

  @ApiProperty({ format: 'uuid' })
  targetId: string;

  @ApiProperty()
  reason: string;

  @ApiProperty({ enum: ['pending', 'resolved', 'dismissed'] })
  status: 'pending' | 'resolved' | 'dismissed';

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ type: AdminReportReporterDto })
  reporter: AdminReportReporterDto;

  /** polymorphic — 상세는 런타임 객체 */
  @ApiPropertyOptional({ nullable: true })
  target: object | null;

  @ApiProperty()
  targetMissing: boolean;
}

export class AdminReportsPageDto {
  @ApiProperty({ type: [AdminReportResponseDto] })
  items: AdminReportResponseDto[];

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  nextCursor: string | null;
}
