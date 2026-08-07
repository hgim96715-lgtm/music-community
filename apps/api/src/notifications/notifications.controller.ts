import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ActiveAccountGuard } from 'src/auth/active-account.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { CountResponseDto } from 'src/common/dto/count-response.dto';
import { OkResponseDto } from 'src/common/dto/ok-response.dto';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, ActiveAccountGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: '내 알림 목록' })
  @ApiOkResponse({ type: NotificationResponseDto, isArray: true })
  @Get()
  async listMine(@UserId() userId: string) {
    return this.notificationsService.listMine(userId);
  }

  @ApiOperation({ summary: '안 읽은 알림 수' })
  @ApiOkResponse({ type: CountResponseDto })
  @Get('unread-count')
  async unreadCount(@UserId() userId: string) {
    return this.notificationsService.unreadCount(userId);
  }

  @ApiOperation({ summary: '전체 읽음' })
  @ApiOkResponse({ type: OkResponseDto })
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(@UserId() userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @ApiOperation({ summary: '알림 하나 읽음' })
  @ApiOkResponse({ type: NotificationResponseDto })
  @Patch(':id/read')
  async markRead(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.notificationsService.markRead(userId, id);
  }
}
