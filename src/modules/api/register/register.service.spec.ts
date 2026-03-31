import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { RegisterService } from './register.service';
import { User } from '../../../models/user.schema';
import { RegisterDto } from './dto/register.dto';

const userId = new Types.ObjectId('507f1f77bcf86cd799439011');

const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
};

const validDto: RegisterDto = {
  email: 'alice@example.com',
  username: 'alice',
  password: 'secret1',
  confirmPassword: 'secret1',
};

describe('RegisterService', () => {
  let service: RegisterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<RegisterService>(RegisterService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw BadRequestException when passwords do not match', async () => {
      const dto: RegisterDto = { ...validDto, confirmPassword: 'different' };

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the email is already registered', async () => {
      mockUserModel.findOne.mockResolvedValue({
        _id: userId,
        email: validDto.email,
      });

      await expect(service.register(validDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('should create a user with a hashed password on success', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({ _id: userId });

      await service.register(validDto);

      expect(mockUserModel.create).toHaveBeenCalledTimes(1);
      const createCall = mockUserModel.create.mock.calls[0][0] as {
        email: string;
        username: string;
        password: string;
      };
      expect(createCall.email).toBe(validDto.email);
      expect(createCall.username).toBe(validDto.username);
      // Password must be hashed, not stored in plain text
      expect(createCall.password).not.toBe(validDto.password);
      expect(await bcrypt.compare(validDto.password, createCall.password)).toBe(
        true,
      );
    });

    it('should return a success message and the new userId', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({ _id: userId });

      const result = await service.register(validDto);

      expect(result).toEqual({
        message: 'User registered successfully',
        userId,
      });
    });

    it('should check for an existing user by email', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({ _id: userId });

      await service.register(validDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: validDto.email,
      });
    });
  });
});
