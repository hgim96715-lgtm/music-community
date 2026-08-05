import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActiveAccountGuard } from 'src/auth/active-account.guard';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller()
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, ActiveAccountGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: '댓글 신고' })
  @Post('comments/:id/reports')
  @HttpCode(HttpStatus.CREATED)
  async createCommentReport(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) commentId: string,
    @Body() dto: CreateReportDto,
  ) {
    return await this.reportsService.createCommentReport(
      commentId,
      userId,
      dto.reason,
    );
  }

  @ApiOperation({ summary: '방 메시지 신고' })
  @Post('rooms/:id/messages/:messageId/reports')
  @HttpCode(HttpStatus.CREATED)
  async reportRoomMessage(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) roomId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() dto: CreateReportDto,
  ) {
    return await this.reportsService.createRoomMessageReport(
      messageId,
      userId,
      dto.reason,
    );
  }

}
