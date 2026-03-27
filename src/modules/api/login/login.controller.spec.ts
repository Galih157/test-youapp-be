import { Test, TestingModule } from '@nestjs/testing';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';

const mockLoginService = {
  login: jest.fn(),
};

describe('LoginController', () => {
  let controller: LoginController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [{ provide: LoginService, useValue: mockLoginService }],
    }).compile();

    controller = module.get<LoginController>(LoginController);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call LoginService.login and return the result', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      mockLoginService.login.mockResolvedValue({ access_token: 'token' });

      const result = await controller.login(dto);

      expect(mockLoginService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ access_token: 'token' });
    });
  });
});
