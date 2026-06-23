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
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateFriendRequestDto } from './dto/create-friends.dto';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findFriends(@UserId() userId: string) {
    return this.friendsService.findFriends(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('requests')
  findRequests(@UserId() userId: string) {
    return this.friendsService.findRequests(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('requests')
  createRequest(
    @Body() dto: CreateFriendRequestDto,
    @UserId() requesterId: string,
  ) {
    return this.friendsService.createRequest(dto.userId, requesterId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('requests/:id')
  respondToRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondFriendRequestDto,
    @UserId() responderId: string,
  ) {
    return this.friendsService.respondToRequest(id, responderId, dto.action);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFriend(
    @Param('userId', ParseUUIDPipe) friendUserId: string,
    @UserId() userId: string,
  ) {
    return this.friendsService.removeFriend(userId, friendUserId);
  }
}
