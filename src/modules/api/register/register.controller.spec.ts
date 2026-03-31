import { Test, TestingModule } from '@nestjs/testing';
import { RegisterController } from './register.controller';
import { RegisterService } from './register.service';
import { RegisterDto } from './dto/register.dto';
import { Types } from 'mongoose';
import { ConflictException } from '@nestjs/common';

const userId = new Types.ObjectId('507f1f77bcf86cd799439011');

const mockRegisterService = {
  register: jest.fn(),
};

const validDto: RegisterDto = {
  email: 'alice@example.com',
  username: 'alice',
  password: 'secret1',
  confirmPassword: 'secret1',
};

describe('RegisterController', () => {
  let controller: RegisterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegisterController],
      providers: [{ provide: RegisterService, useValue: mockRegisterService }],
    }).compile();

    controller = module.get<RegisterController>(RegisterController);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call registerService.register with the dto and return the result', async () => {
      const serviceResult = { message: 'User registered successfully', userId };
      mockRegisterService.register.mockResolvedValue(serviceResult);

      const result = await controller.register(validDto);

      expect(mockRegisterService.register).toHaveBeenCalledWith(validDto);
      expect(result).toEqual(serviceResult);
    });

    it('should propagate exceptions thrown by registerService', async () => {
      mockRegisterService.register.mockRejectedValue(
        new ConflictException('Email already in use'),
      );

      await expect(controller.register(validDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
