import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Namespace;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn(`Connection rejected [${client.id}]: no token provided`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(token);
      (client.data as { userId: string }).userId = payload.sub;
      void client.join(`user:${payload.sub}`);
      this.logger.log(
        `Client connected [${client.id}] — userId: ${payload.sub}`,
      );
    } catch {
      this.logger.warn(`Connection rejected [${client.id}]: invalid token`);
      client.disconnect();
    }
  }

  /** Accepts token from handshake.auth.token or Authorization header (Bearer). */
  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) return authToken;

    const authHeader = client.handshake.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

    return undefined;
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as { userId?: string }).userId;
    this.logger.log(
      `Client disconnected [${client.id}]${userId ? ` — userId: ${userId}` : ''}`,
    );
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatRoomId: string,
  ) {
    void client.join(`chatRoom:${chatRoomId}`);
    this.logger.log(`[${client.id}] joined room: ${chatRoomId}`);
  }

  /**
   * Emits the new message + updated chatRoom to the shared chatRoom socket room.
   * Both participants receive the same event; the frontend uses senderId to
   * determine which side of the conversation to render.
   */
  emitToRoom(result: unknown, chatRoomId: string) {
    this.logger.log(`Emitting newMessage to chatRoom: ${chatRoomId}`);
    this.server.to(`chatRoom:${chatRoomId}`).emit('newMessage', result);
  }

  /**
   * Notifies the recipient that a new chat room has been created.
   * The recipient's client should respond by emitting joinRoom with the chatRoomId.
   */
  notifyNewRoom(chatRoom: unknown, recipientId: string) {
    this.logger.log(`Notifying newRoom to user: ${recipientId}`);
    this.server.to(`user:${recipientId}`).emit('newRoom', chatRoom);
  }
}
