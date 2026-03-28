import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../../utils/jwt-auth.guard';

const mockProfileService = {
  createProfile: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
};

const mockReq = {
  user: { sub: '507f1f77bcf86cd799439011', email: 'test@example.com' },
} as any;

describe('ProfileController', () => {
  let controller: ProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: mockProfileService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProfileController>(ProfileController);
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    it('should call ProfileService.createProfile and return result', async () => {
      const dto = { displayName: 'Test User', height: 175, weight: 70 };
      const profile = { _id: 'profile-id', userId: mockReq.user.sub, ...dto };
      mockProfileService.createProfile.mockResolvedValue(profile);

      const result = await controller.createProfile(mockReq, dto);

      expect(mockProfileService.createProfile).toHaveBeenCalledWith(
        mockReq.user.sub,
        dto,
      );
      expect(result).toEqual(profile);
    });
  });

  describe('getProfile', () => {
    it('should call ProfileService.getProfile and return result', async () => {
      const profile = {
        _id: 'profile-id',
        userId: mockReq.user.sub,
        displayName: 'Test User',
      };
      mockProfileService.getProfile.mockResolvedValue(profile);

      const result = await controller.getProfile(mockReq);

      expect(mockProfileService.getProfile).toHaveBeenCalledWith(
        mockReq.user.sub,
      );
      expect(result).toEqual(profile);
    });
  });

  describe('updateProfile', () => {
    it('should call ProfileService.updateProfile and return result', async () => {
      const dto = { displayName: 'Updated Name', height: 180 };
      const updated = { _id: 'profile-id', userId: mockReq.user.sub, ...dto };
      mockProfileService.updateProfile.mockResolvedValue(updated);

      const result = await controller.updateProfile(mockReq, dto);

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        mockReq.user.sub,
        dto,
      );
      expect(result).toEqual(updated);
    });
  });
});
