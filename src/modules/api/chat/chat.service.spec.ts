import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ChatService } from './chat.service';
import { ChatRoom } from '../../../models/chat-room.schema';
import { Message } from '../../../models/message.schema';
import { SendMessageDto } from './dto/send-message.dto';

const senderIdStr = '507f1f77bcf86cd799439011';
const recipientIdStr = '507f1f77bcf86cd799439012';
const chatRoomIdStr = '507f1f77bcf86cd799439013';
const messageIdStr = '507f1f77bcf86cd799439014';

const mockChatRoom = {
  _id: new Types.ObjectId(chatRoomIdStr),
  participants: [
    new Types.ObjectId(senderIdStr),
    new Types.ObjectId(recipientIdStr),
  ],
  lastMessage: undefined,
};

const mockMessage = {
  _id: new Types.ObjectId(messageIdStr),
  chatRoomId: new Types.ObjectId(chatRoomIdStr),
  senderId: new Types.ObjectId(senderIdStr),
  receiverId: new Types.ObjectId(recipientIdStr),
  content: 'Hello!',
};

const mockUpdatedRoom = { ...mockChatRoom, lastMessage: mockMessage };

/** Builds a chainable populate().lean().exec() mock */
function buildFindByIdAndUpdateMock(resolvedValue: unknown) {
  return jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  });
}

/** Builds a chainable populate().sort().lean().exec() mock */
function buildFindMock(resolvedValue: unknown) {
  return jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(resolvedValue),
        }),
      }),
    }),
  });
}

const mockChatRoomModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: buildFindByIdAndUpdateMock(mockUpdatedRoom),
  find: buildFindMock([mockUpdatedRoom]),
};

/** Builds a chainable find().sort().lean().exec() mock for messageModel */
function buildMessageFindMock(resolvedValue: unknown) {
  return jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  });
}

const mockMessageModel = {
  create: jest.fn(),
  find: buildMessageFindMock([mockMessage]),
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getModelToken(ChatRoom.name), useValue: mockChatRoomModel },
        { provide: getModelToken(Message.name), useValue: mockMessageModel },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();

    // Reset chainable mocks after clearAllMocks
    mockChatRoomModel.findByIdAndUpdate = buildFindByIdAndUpdateMock(mockUpdatedRoom);
    mockChatRoomModel.find = buildFindMock([mockUpdatedRoom]);
    mockMessageModel.find = buildMessageFindMock([mockMessage]);
  });

  describe('sendMessage', () => {
    const dto: SendMessageDto = {
      recipientId: recipientIdStr,
      content: 'Hello!',
    };

    it('should reuse an existing chat room when one already exists', async () => {
      mockChatRoomModel.findOne.mockResolvedValue(mockChatRoom);
      mockMessageModel.create.mockResolvedValue(mockMessage);

      const result = await service.sendMessage(senderIdStr, dto);

      expect(mockChatRoomModel.findOne).toHaveBeenCalledWith({
        participants: {
          $all: [new Types.ObjectId(senderIdStr), new Types.ObjectId(recipientIdStr)],
          $size: 2,
        },
      });
      expect(mockChatRoomModel.create).not.toHaveBeenCalled();
      expect(result.message).toEqual(mockMessage);
      expect(result.chatRoom).toEqual(mockUpdatedRoom);
      expect(result.isNewRoom).toBe(false);
    });

    it('should create a new chat room when none exists', async () => {
      mockChatRoomModel.findOne.mockResolvedValue(null);
      mockChatRoomModel.create.mockResolvedValue(mockChatRoom);
      mockMessageModel.create.mockResolvedValue(mockMessage);

      const result = await service.sendMessage(senderIdStr, dto);

      expect(mockChatRoomModel.create).toHaveBeenCalledWith({
        participants: [
          new Types.ObjectId(senderIdStr),
          new Types.ObjectId(recipientIdStr),
        ],
      });
      expect(result.isNewRoom).toBe(true);
    });

    it('should create a message with correct fields', async () => {
      mockChatRoomModel.findOne.mockResolvedValue(mockChatRoom);
      mockMessageModel.create.mockResolvedValue(mockMessage);

      await service.sendMessage(senderIdStr, dto);

      expect(mockMessageModel.create).toHaveBeenCalledWith({
        chatRoomId: mockChatRoom._id,
        senderId: new Types.ObjectId(senderIdStr),
        receiverId: new Types.ObjectId(recipientIdStr),
        content: dto.content,
      });
    });

    it('should update the chat room lastMessage and return populated result', async () => {
      mockChatRoomModel.findOne.mockResolvedValue(mockChatRoom);
      mockMessageModel.create.mockResolvedValue(mockMessage);

      const result = await service.sendMessage(senderIdStr, dto);

      expect(mockChatRoomModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockChatRoom._id,
        { $set: { lastMessage: mockMessage._id } },
        { new: true },
      );
      expect(result.chatRoom).toEqual(mockUpdatedRoom);
    });
  });

  describe('viewMessages', () => {
    it('should return all chat rooms for the user with populated lastMessage', async () => {
      const result = await service.viewMessages(senderIdStr);

      expect(mockChatRoomModel.find).toHaveBeenCalledWith({
        participants: new Types.ObjectId(senderIdStr),
      });
      expect(result).toEqual([mockUpdatedRoom]);
    });

    it('should return an empty array when user has no chat rooms', async () => {
      mockChatRoomModel.find = buildFindMock([]);

      const result = await service.viewMessages(senderIdStr);

      expect(result).toEqual([]);
    });
  });

  describe('getMessagesInRoom', () => {
    /** Builds a chainable findOne().lean().exec() mock */
    function buildChatRoomFindOneMock(resolvedValue: unknown) {
      return jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(resolvedValue),
        }),
      });
    }

    it('should return messages sorted by createdAt when user is a participant', async () => {
      mockChatRoomModel.findOne = buildChatRoomFindOneMock(mockChatRoom);

      const result = await service.getMessagesInRoom(chatRoomIdStr, senderIdStr);

      expect(mockChatRoomModel.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(chatRoomIdStr),
        participants: new Types.ObjectId(senderIdStr),
      });
      expect(mockMessageModel.find).toHaveBeenCalledWith({
        chatRoomId: new Types.ObjectId(chatRoomIdStr),
      });
      expect(result).toEqual([mockMessage]);
    });

    it('should return an empty array when the room has no messages', async () => {
      mockChatRoomModel.findOne = buildChatRoomFindOneMock(mockChatRoom);
      mockMessageModel.find = buildMessageFindMock([]);

      const result = await service.getMessagesInRoom(chatRoomIdStr, senderIdStr);

      expect(result).toEqual([]);
    });

    it('should throw ForbiddenException when user is not a participant', async () => {
      mockChatRoomModel.findOne = buildChatRoomFindOneMock(null);

      await expect(
        service.getMessagesInRoom(chatRoomIdStr, senderIdStr),
      ).rejects.toThrow(new ForbiddenException('Chat room not found or access denied'));

      expect(mockMessageModel.find).not.toHaveBeenCalled();
    });
  });
});
