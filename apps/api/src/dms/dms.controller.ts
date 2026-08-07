import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ActiveAccountGuard,
  AllowWithdrawing,
} from 'src/auth/active-account.guard';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChatGateway } from 'src/realtime/chat.gateway';
import { DmsService } from './dms.service';
import { OpenDmDto } from './dto/open-dm.dto';
import { SendDmMessageDto } from './dto/send-dm-message.dto';
import {
  DmDetailResponseDto,
  DmListItemResponseDto,
  DmMessageResponseDto,
  DmRequestItemResponseDto,
} from './dto/dm-response.dto';

@ApiTags('DMs')
@Controller('dms')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, ActiveAccountGuard)
export class DmsController {
  constructor(
    private readonly dmsService: DmsService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @ApiOperation({ summary: '열린 DM 목록' })
  @ApiOkResponse({ type: DmListItemResponseDto, isArray: true })
  @AllowWithdrawing()
  @Get()
  async listMine(@UserId() userId: string) {
    return await this.dmsService.listMine(userId);
  }

  @ApiOperation({ summary: '받은 DM 목록' })
  @ApiOkResponse({ type: DmRequestItemResponseDto, isArray: true })
  @AllowWithdrawing()
  @Get('requests')
  async listRequests(@UserId() userId: string) {
    return await this.dmsService.listRequests(userId);
  }

  @ApiOperation({ summary: 'DM 상세 (상대·status)' })
  @ApiOkResponse({ type: DmDetailResponseDto })
  @AllowWithdrawing()
  @Get(':id')
  async findById(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) dmId: string,
  ) {
    return await this.dmsService.findById(dmId, userId);
  }

  @ApiOperation({ summary: 'DM 열기 또는 요청 (없으면 생성)' })
  @Post()
  async openOrGet(@UserId() userId: string, @Body() dto: OpenDmDto) {
    return await this.dmsService.openOrGet(userId, dto.otherUserId);
  }

  @ApiOperation({ summary: 'DM 요청 수락' })
  @Post(':id/accept')
  async accept(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) dmId: string,
  ) {
    const before = await this.dmsService.findById(dmId, userId);
    const dm = await this.dmsService.accept(dmId, userId);
    if (before.requestedById) {
      this.chatGateway.emitDmAccepted(before.requestedById, dmId);
    }
    return dm;
  }

  @ApiOperation({ summary: 'DM 요청 거절' })
  @Post(':id/decline')
  async decline(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) dmId: string,
  ) {
    return await this.dmsService.decline(dmId, userId);
  }

  @ApiOperation({ summary: 'DM 메시지 목록' })
  @ApiOkResponse({ type: DmMessageResponseDto, isArray: true })
  @AllowWithdrawing()
  @Get(':id/messages')
  async listMessages(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) dmId: string,
  ) {
    return await this.dmsService.listMessages(dmId, userId);
  }

  @ApiOperation({ summary: 'DM 메시지 전송' })
  @ApiOkResponse({ type: DmMessageResponseDto })
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) dmId: string,
    @Body() dto: SendDmMessageDto,
  ) {
    const message = await this.dmsService.sendMessage(dmId, userId, dto.body);
    this.chatGateway.emitDmMessage(dmId, message);
    const { other } = await this.dmsService.findById(dmId, userId);
    if (other?.id) {
      this.chatGateway.emitDmUnread(other.id, { dmId, unread: true });
    }
    return message;
  }

  @ApiOperation({ summary: 'DM 메시지 읽음 처리' })
  @Post(':id/read')
  async markRead(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) dmId: string,
  ) {
    const result = await this.dmsService.markRead(dmId, userId);
    this.chatGateway.emitDmUnread(userId, { dmId, unread: false });
    return result;
  }
}
