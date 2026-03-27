import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { LoginService } from './login.service';
import { User } from '../../../models/user.schema';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';

const mockUser = {
  _id: 'user-id-1',
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashed_password',
};

const mockUserModel = {
  findOne: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('LoginService', () => {
  let service: LoginService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return an access_token on valid credentials', async () => {
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.findOne.mockReturnValue({ select: selectMock });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('signed.jwt.token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'plaintext_password',
      });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(selectMock).toHaveBeenCalledWith('+password');
      expect(bcrypt.compare).toHaveBeenCalledWith('plaintext_password', mockUser.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
      });
      expect(result).toEqual({ access_token: 'signed.jwt.token' });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      mockUserModel.findOne.mockReturnValue({ select: selectMock });

      await expect(
        service.login({ email: 'unknown@example.com', password: 'any_password' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.findOne.mockReturnValue({ select: selectMock });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong_password' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
