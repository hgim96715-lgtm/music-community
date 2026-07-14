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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';
import { FriendsService } from './friends.service';

@ApiTags('Friends')
@Controller('friends')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @ApiOperation({ summary: '내 친구 목록 (accepted)' })
  @Get()
  async listFriends(@UserId() userId: string) {
    return await this.friendsService.listFriends(userId);
  }

  @ApiOperation({ summary: '받은·보낸 친구 요청 (pending)' })
  @Get('requests')
  async listRequest(@UserId() userId: string) {
    return await this.friendsService.listRequest(userId);
  }

  @ApiOperation({ summary: '친구 요청 보내기' })
  @Post('requests')
  async createRequest(
    @UserId() userId: string,
    @Body() dto: CreateFriendRequestDto,
  ) {
    return await this.friendsService.createRequest(userId, dto.userId);
  }

  @ApiOperation({ summary: '친구 요청 수락·거절' })
  @Patch('requests/:id')
  async respond(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) friendshipId: string,
    @Body() dto: RespondFriendRequestDto,
  ) {
    return await this.friendsService.respond(friendshipId, userId, dto.action);
  }

  @ApiOperation({ summary: '요청 취소 또는 친구 삭제' })
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @UserId() userId: string,
    @Param('userId', ParseUUIDPipe) otherUserId: string,
  ) {
    return await this.friendsService.remove(userId, otherUserId);
  }
}
