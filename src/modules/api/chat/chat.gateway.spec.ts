import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';

const senderIdStr = '507f1f77bcf86cd799439011';

/** Creates a minimal Socket mock */
function makeSocket(token?: string, id = 'socket-id', useHeader = false): any {
  return {
    id,
    handshake: {
      auth: !useHeader && token ? { token } : {},
      headers: useHeader && token ? { authorization: `Bearer ${token}` } : {},
    },
    data: {} as { userId?: string },
    join: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
  };
}

const mockJwtService = {
  verify: jest.fn(),
};

const mockServerEmit = jest.fn();
const mockServerTo = jest.fn().mockReturnValue({ emit: mockServerEmit });

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);

    // Attach a mock server
    (gateway as any).server = { to: mockServerTo };

    jest.clearAllMocks();
    mockServerTo.mockReturnValue({ emit: mockServerEmit });
  });

  describe('handleConnection', () => {
    it('should disconnect a client that provides no token', () => {
      const client = makeSocket();

      gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should disconnect a client when jwt verification throws', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });
      const client = makeSocket('bad.token');

      gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should store userId on client.data and join the user room on valid token', () => {
      mockJwtService.verify.mockReturnValue({ sub: senderIdStr });
      const client = makeSocket('valid.token');

      gateway.handleConnection(client);

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid.token');
      expect((client.data as any).userId).toBe(senderIdStr);
      expect(client.join).toHaveBeenCalledWith(`user:${senderIdStr}`);
    });

    it('should accept a token supplied via Authorization header', () => {
      mockJwtService.verify.mockReturnValue({ sub: senderIdStr });
      const client = makeSocket('valid.token', 'socket-id', true);

      gateway.handleConnection(client);

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid.token');
      expect((client.data as any).userId).toBe(senderIdStr);
      expect(client.join).toHaveBeenCalledWith(`user:${senderIdStr}`);
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnection with userId when available', () => {
      const client = makeSocket();
      (client.data as any).userId = senderIdStr;
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });

    it('should log disconnection without userId when no auth took place', () => {
      const client = makeSocket();
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });

  describe('handleJoinRoom', () => {
    it('should join the client to the chatRoom socket room', () => {
      const client = makeSocket('valid.token');
      const chatRoomId = '507f1f77bcf86cd799439013';

      gateway.handleJoinRoom(client, chatRoomId);

      expect(client.join).toHaveBeenCalledWith(`chatRoom:${chatRoomId}`);
      expect(client.join).toHaveBeenCalledTimes(1);
    });

    it('should not emit anything to the server when joining a room', () => {
      const client = makeSocket('valid.token');

      gateway.handleJoinRoom(client, '507f1f77bcf86cd799439013');

      expect(mockServerTo).not.toHaveBeenCalled();
    });
  });

  describe('emitToRoom', () => {
    const payload = { message: 'data' };
    const chatRoomId = '507f1f77bcf86cd799439013';

    it('should emit newMessage once to the shared chatRoom room', () => {
      gateway.emitToRoom(payload, chatRoomId);

      expect(mockServerTo).toHaveBeenCalledWith(`chatRoom:${chatRoomId}`);
      expect(mockServerTo).toHaveBeenCalledTimes(1);
      expect(mockServerEmit).toHaveBeenCalledWith('newMessage', payload);
    });
  });

  describe('notifyNewRoom', () => {
    const chatRoom = { id: '507f1f77bcf86cd799439013', participants: [] };
    const recipientId = '507f1f77bcf86cd799439012';

    it('should emit newRoom event to the recipient user room', () => {
      gateway.notifyNewRoom(chatRoom, recipientId);

      expect(mockServerTo).toHaveBeenCalledWith(`user:${recipientId}`);
      expect(mockServerTo).toHaveBeenCalledTimes(1);
      expect(mockServerEmit).toHaveBeenCalledWith('newRoom', chatRoom);
    });
  });
});
