import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../../../utils/jwt-auth.guard';
import { CurrentUser } from '../../../utils/current-user.decorator';
import type { AuthUser } from '../../../utils/current-user.decorator';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatRoomViewModel } from './viewmodels/chat-room.viewmodel';
import { SendMessageViewModel } from './viewmodels/send-message.viewmodel';
import { MessageViewModel } from './viewmodels/message.viewmodel';

@Controller('')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('viewMessages')
  async viewMessages(@CurrentUser() user: AuthUser) {
    const rooms = await this.chatService.viewMessages(user.sub);

    return plainToInstance(ChatRoomViewModel, rooms);
  }

  @Get('viewMessages/:chatRoomId')
  async getMessagesInRoom(
    @CurrentUser() user: AuthUser,
    @Param('chatRoomId') chatRoomId: string,
  ) {
    const messages = await this.chatService.getMessagesInRoom(
      chatRoomId,
      user.sub,
    );

    return plainToInstance(MessageViewModel, messages);
  }

  @Post('sendMessage')
  async sendMessage(
    @CurrentUser() user: AuthUser,
    @Body() dto: SendMessageDto,
  ) {
    const result = await this.chatService.sendMessage(user.sub, dto);
    const viewModel = plainToInstance(SendMessageViewModel, result);
    this.chatGateway.emitToRoom(viewModel, result.chatRoom!._id.toString());

    if (result.isNewRoom) {
      this.chatGateway.notifyNewRoom(
        plainToInstance(ChatRoomViewModel, result.chatRoom),
        dto.recipientId,
      );
    }

    return viewModel;
  }
}
