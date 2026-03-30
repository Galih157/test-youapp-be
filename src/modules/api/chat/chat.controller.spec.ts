import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../../../utils/jwt-auth.guard';
import { ChatRoomViewModel } from './viewmodels/chat-room.viewmodel';
import { SendMessageViewModel } from './viewmodels/send-message.viewmodel';
import { MessageViewModel } from './viewmodels/message.viewmodel';

const senderIdStr = '507f1f77bcf86cd799439011';
const recipientIdStr = '507f1f77bcf86cd799439012';

const mockUser = { sub: senderIdStr, email: 'test@example.com' };

const mockChatService = {
  viewMessages: jest.fn(),
  sendMessage: jest.fn(),
  getMessagesInRoom: jest.fn(),
};

const mockChatGateway = {
  emitToRoom: jest.fn(),
  notifyNewRoom: jest.fn(),
};

describe('ChatController', () => {
  let controller: ChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChatController>(ChatController);
    jest.clearAllMocks();
  });

  describe('viewMessages', () => {
    it('should call chatService.viewMessages with the authenticated user id', async () => {
      const chatRooms = [{ _id: 'room-1', participants: [] }];
      mockChatService.viewMessages.mockResolvedValue(chatRooms);

      const result = await controller.viewMessages(mockUser);

      expect(mockChatService.viewMessages).toHaveBeenCalledWith(senderIdStr);
      expect(result).toEqual(plainToInstance(ChatRoomViewModel, chatRooms));
    });

    it('should return an empty array when the user has no conversations', async () => {
      mockChatService.viewMessages.mockResolvedValue([]);

      const result = await controller.viewMessages(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    const dto: SendMessageDto = {
      recipientId: recipientIdStr,
      content: 'Hello!',
    };

    it('should call chatService.sendMessage, emit to chatRoom room via gateway, and return the result', async () => {
      const chatRoomId = '507f1f77bcf86cd799439013';
      const serviceResult = {
        message: { content: 'Hello!' },
        chatRoom: { _id: { toString: () => chatRoomId }, participants: [] },
        isNewRoom: false,
      };
      mockChatService.sendMessage.mockResolvedValue(serviceResult);

      const result = await controller.sendMessage(mockUser, dto);

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        senderIdStr,
        dto,
      );
      expect(mockChatGateway.emitToRoom).toHaveBeenCalledWith(
        plainToInstance(SendMessageViewModel, serviceResult),
        chatRoomId,
      );
      expect(mockChatGateway.notifyNewRoom).not.toHaveBeenCalled();
      expect(result).toEqual(
        plainToInstance(SendMessageViewModel, serviceResult),
      );
    });

    it('should emit to the chatRoom room derived from the service result', async () => {
      const chatRoomId = '507f1f77bcf86cd799439099';
      const serviceResult = {
        message: { content: 'Hi' },
        chatRoom: { _id: { toString: () => chatRoomId }, participants: [] },
        isNewRoom: false,
      };
      mockChatService.sendMessage.mockResolvedValue(serviceResult);

      await controller.sendMessage(mockUser, dto);

      expect(mockChatGateway.emitToRoom).toHaveBeenCalledWith(
        plainToInstance(SendMessageViewModel, serviceResult),
        chatRoomId,
      );
    });

    it('should call notifyNewRoom with ChatRoomViewModel and recipientId when a new room is created', async () => {
      const chatRoomId = '507f1f77bcf86cd799439013';
      const serviceResult = {
        message: { content: 'Hello!' },
        chatRoom: { _id: { toString: () => chatRoomId }, participants: [] },
        isNewRoom: true,
      };
      mockChatService.sendMessage.mockResolvedValue(serviceResult);

      await controller.sendMessage(mockUser, dto);

      expect(mockChatGateway.notifyNewRoom).toHaveBeenCalledWith(
        plainToInstance(ChatRoomViewModel, serviceResult.chatRoom),
        recipientIdStr,
      );
    });

    it('should not call notifyNewRoom when the chat room already existed', async () => {
      const chatRoomId = '507f1f77bcf86cd799439013';
      const serviceResult = {
        message: { content: 'Hello!' },
        chatRoom: { _id: { toString: () => chatRoomId }, participants: [] },
        isNewRoom: false,
      };
      mockChatService.sendMessage.mockResolvedValue(serviceResult);

      await controller.sendMessage(mockUser, dto);

      expect(mockChatGateway.notifyNewRoom).not.toHaveBeenCalled();
    });

    it('should propagate errors from chatService.sendMessage', async () => {
      mockChatService.sendMessage.mockRejectedValue(new Error('Send failed'));

      await expect(controller.sendMessage(mockUser, dto)).rejects.toThrow(
        'Send failed',
      );
      expect(mockChatGateway.emitToRoom).not.toHaveBeenCalled();
    });
  });

  describe('getMessagesInRoom', () => {
    const chatRoomId = '507f1f77bcf86cd799439013';

    it('should return messages for the given room as MessageViewModels', async () => {
      const messages = [
        {
          _id: 'msg-1',
          chatRoomId,
          senderId: senderIdStr,
          receiverId: recipientIdStr,
          content: 'Hi',
        },
      ];
      mockChatService.getMessagesInRoom.mockResolvedValue(messages);

      const result = await controller.getMessagesInRoom(mockUser, chatRoomId);

      expect(mockChatService.getMessagesInRoom).toHaveBeenCalledWith(
        chatRoomId,
        senderIdStr,
      );
      expect(result).toEqual(plainToInstance(MessageViewModel, messages));
    });

    it('should return an empty array when the room has no messages', async () => {
      mockChatService.getMessagesInRoom.mockResolvedValue([]);

      const result = await controller.getMessagesInRoom(mockUser, chatRoomId);

      expect(result).toEqual([]);
    });

    it('should propagate errors from chatService.getMessagesInRoom', async () => {
      mockChatService.getMessagesInRoom.mockRejectedValue(
        new Error('Forbidden'),
      );

      await expect(
        controller.getMessagesInRoom(mockUser, chatRoomId),
      ).rejects.toThrow('Forbidden');
    });
  });
});
