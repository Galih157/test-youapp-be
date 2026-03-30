import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChatRoom,
  ChatRoomDocument,
} from '../../../models/chat-room.schema';
import { Message, MessageDocument } from '../../../models/message.schema';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatRoom.name)
    private readonly chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  private async findOrCreateChatRoom(
    userIdA: string,
    userIdB: string,
  ): Promise<{ room: ChatRoomDocument; isNew: boolean }> {
    const a = new Types.ObjectId(userIdA);
    const b = new Types.ObjectId(userIdB);

    const existing = await this.chatRoomModel.findOne({
      participants: { $all: [a, b], $size: 2 },
    });
    if (existing) return { room: existing, isNew: false };

    const room = await this.chatRoomModel.create({ participants: [a, b] });
    return { room, isNew: true };
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const { room: chatRoom, isNew: isNewRoom } = await this.findOrCreateChatRoom(senderId, dto.recipientId);

    const message = await this.messageModel.create({
      chatRoomId: chatRoom._id,
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(dto.recipientId),
      content: dto.content,
    });

    const updatedRoom = await this.chatRoomModel
      .findByIdAndUpdate(
        chatRoom._id,
        { $set: { lastMessage: message._id } },
        { new: true },
      )
      .populate('lastMessage')
      .lean()
      .exec();

    return { message, chatRoom: updatedRoom, isNewRoom };
  }

  async viewMessages(userId: string) {
    return this.chatRoomModel
      .find({ participants: new Types.ObjectId(userId) })
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  async getMessagesInRoom(chatRoomId: string, userId: string) {
    const room = await this.chatRoomModel
      .findOne({
        _id: new Types.ObjectId(chatRoomId),
        participants: new Types.ObjectId(userId),
      })
      .lean()
      .exec();

    if (!room) throw new ForbiddenException('Chat room not found or access denied');

    return this.messageModel
      .find({ chatRoomId: new Types.ObjectId(chatRoomId) })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }
}
