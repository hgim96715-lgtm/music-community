import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';
import { CreateRoomMessageDto } from './dto/create-room-message.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { ChatGateway } from 'src/realtime/chat.gateway';
import { TransfreRoomDto } from './dto/tansfer-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import {
  ActiveAccountGuard,
  AllowWithdrawing,
} from 'src/auth/active-account.guard';
import { ListRoomMemberQueryDto } from './dto/list-room-members-query.dto';
import { UpdateRoomChatThemeDto } from './dto/update-room-chat-theme.dto';
import { ToggleRoomMessageReactioinDto } from './dto/toggle-room-message-reaction.dto';

@ApiTags('Rooms')
@Controller('rooms')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, ActiveAccountGuard)
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @ApiOperation({ summary: '공개 방 목록 조회' })
  @AllowWithdrawing()
  @Get()
  async listPublic() {
    return await this.roomsService.listPublic();
  }

  @ApiOperation({ summary: '내 방 목록(멤버인 방)' })
  @AllowWithdrawing()
  @Get('mine')
  async listMine(@UserId() userId: string) {
    return await this.roomsService.listMine(userId);
  }

  @ApiOperation({ summary: '방 메시지 목록 조회' })
  @AllowWithdrawing()
  @Get(':id/messages')
  async listMessages(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
  ) {
    return await this.roomsService.listMessages(roomId, userId);
  }

  @ApiOperation({ summary: '방 상세 조회' })
  @AllowWithdrawing()
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) roomId: string) {
    return await this.roomsService.findById(roomId);
  }

  @ApiOperation({ summary: '방 생성 (생성자=방장)' })
  @Post()
  async create(@UserId() userId: string, @Body() dto: CreateRoomDto) {
    return await this.roomsService.create(userId, dto);
  }

  @ApiOperation({ summary: '공개 방 입장' })
  @Post(':id/join')
  async join(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Body() dto: JoinRoomDto,
  ) {
    return await this.roomsService.join(roomId, userId, dto.password);
  }

  @ApiOperation({ summary: '방 메시지 읽음 처리' })
  @Post(':id/read')
  async markRead(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
  ) {
    const result = await this.roomsService.markRead(roomId, userId);
    this.chatGateway.emitRoomUnread(userId, { roomId, unread: false });
    return result;
  }

  @ApiOperation({ summary: '방 퇴장' })
  @Post(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
  ) {
    return await this.roomsService.leave(roomId, userId);
  }

  @ApiOperation({ summary: '멤버 강퇴(방장)' })
  @Post(':id/members/:userId/kick')
  @HttpCode(HttpStatus.NO_CONTENT)
  async kick(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    const message = await this.roomsService.kick(roomId, userId, targetUserId);
    this.chatGateway.emitMemberKicked(roomId, targetUserId);
    this.chatGateway.emitMessage(roomId, message);
  }
  @ApiOperation({ summary: '방 설정 수정(방장)' })
  @Patch(':id')
  async update(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    const updated = await this.roomsService.update(roomId, userId, dto);
    this.chatGateway.emitRoomUpdated(roomId, {
      description: updated.description,
      name: updated.name,
      topicTags: updated.topicTags,
      updatedAt:
        updated.updatedAt instanceof Date
          ? updated.updatedAt.toISOString()
          : String(updated.updatedAt),
    });
    return updated;
  }

  @ApiOperation({ summary: '방 닫기(방장만)' })
  @Post(':id/close')
  async close(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
  ) {
    return await this.roomsService.close(roomId, userId);
  }

  @ApiOperation({ summary: '방장 넘기기' })
  @Post(':id/transfer')
  async transfer(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Body() dto: TransfreRoomDto,
  ) {
    return await this.roomsService.transfer(roomId, userId, dto.userId);
  }

  @ApiOperation({ summary: '방 메시지 전송' })
  @Post(':id/messages')
  async sendMessage(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Body() dto: CreateRoomMessageDto,
  ) {
    const message = await this.roomsService.createMessage(roomId, userId, dto);
    this.chatGateway.emitMessage(roomId, message);
    const others = await this.roomsService.listOtherMemberUserIds(
      roomId,
      userId,
    );
    for (const other of others) {
      this.chatGateway.emitRoomUnread(other, { roomId, unread: true });
    }
    return message;
  }

  @ApiOperation({ summary: '방 멤버 목록(멤버만)' })
  @AllowWithdrawing()
  @Get(':id/members')
  async listMembers(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Query() query: ListRoomMemberQueryDto,
  ) {
    return await this.roomsService.listMembers(roomId, userId, query);
  }

  @ApiOperation({ summary: '메시지 전체에서 삭제(작성자·방장)' })
  @Delete(':id/messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    const message = await this.roomsService.deleteMessage(
      roomId,
      messageId,
      userId,
    );
    this.chatGateway.emitMessageDeleted(roomId, message);
  }

  @ApiOperation({ summary: '메시지 나에게서만 삭제(멤버)' })
  @Post(':id/messages/:messageId/hide')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hideMessage(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    await this.roomsService.hideMessage(roomId, messageId, userId);
  }

  @ApiOperation({ summary: '방 채팅 테마 조회' })
  @AllowWithdrawing()
  @Get(':id/theme')
  async getChatTheme(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
  ) {
    return await this.roomsService.getChatTheme(roomId, userId);
  }

  @ApiOperation({ summary: '방 채팅 테마 수정' })
  @AllowWithdrawing()
  @Patch(':id/theme')
  async updateChatTheme(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Body() dto: UpdateRoomChatThemeDto,
  ) {
    return await this.roomsService.upsertChatTheme(roomId, userId, dto);
  }

  @ApiOperation({ summary: '메시지 탭백 토글(멤버)' })
  @Post(':id/messages/:messageId/reactions')
  async toggleReaction(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() dto: ToggleRoomMessageReactioinDto,
  ) {
    const result = await this.roomsService.toggleReaction(
      roomId,
      messageId,
      userId,
      dto.emoji,
    );
    this.chatGateway.emitMessageReaction(roomId, result);
    return result;
  }
}
