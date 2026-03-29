import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../../utils/jwt-auth.guard';
import { Gender } from '../../../enums/gender.enum';
import { ProfileViewModel } from './viewmodels/profile.viewmodel';

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
    it('should return a ProfileViewModel mapped from the service result', async () => {
      const dto = { displayName: 'Test User', height: 175, weight: 70 };
      const doc = {
        _id: 'profile-id',
        userId: mockReq.user.sub,
        __v: 0,
        displayName: 'Test User',
        gender: Gender.Male,
        birthday: new Date('1990-06-15'),
        horoscope: 'Gemini',
        zodiac: 'Horse',
        height: 175,
        weight: 70,
        interests: ['coding'],
      };
      mockProfileService.createProfile.mockResolvedValue(doc);

      const result = await controller.createProfile(mockReq, dto);

      expect(mockProfileService.createProfile).toHaveBeenCalledWith(mockReq.user.sub, dto);
      expect(result).toBeInstanceOf(ProfileViewModel);
      expect(result).toEqual(
        expect.objectContaining({
          displayName: 'Test User',
          gender: Gender.Male,
          birthday: '1990-06-15',
          horoscope: 'Gemini',
          zodiac: 'Horse',
          height: 175,
          weight: 70,
          interests: ['coding'],
        }),
      );
      expect((result as any)._id).toBeUndefined();
      expect((result as any).userId).toBeUndefined();
      expect((result as any).__v).toBeUndefined();
    });
  });

  describe('getProfile', () => {
    it('should return a ProfileViewModel mapped from the service result', async () => {
      const doc = {
        _id: 'profile-id',
        userId: mockReq.user.sub,
        __v: 0,
        displayName: 'Test User',
        interests: [],
      };
      mockProfileService.getProfile.mockResolvedValue(doc);

      const result = await controller.getProfile(mockReq);

      expect(mockProfileService.getProfile).toHaveBeenCalledWith(mockReq.user.sub);
      expect(result).toBeInstanceOf(ProfileViewModel);
      expect(result).toEqual(
        expect.objectContaining({ displayName: 'Test User', interests: [] }),
      );
      expect((result as any)._id).toBeUndefined();
      expect((result as any).userId).toBeUndefined();
    });
  });

  describe('updateProfile', () => {
    it('should return a ProfileViewModel mapped from the service result', async () => {
      const dto = { displayName: 'Updated Name', height: 180 };
      const doc = {
        _id: 'profile-id',
        userId: mockReq.user.sub,
        __v: 0,
        displayName: 'Updated Name',
        height: 180,
        interests: [],
      };
      mockProfileService.updateProfile.mockResolvedValue(doc);

      const result = await controller.updateProfile(mockReq, dto);

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(mockReq.user.sub, dto);
      expect(result).toBeInstanceOf(ProfileViewModel);
      expect(result).toEqual(
        expect.objectContaining({ displayName: 'Updated Name', height: 180 }),
      );
      expect((result as any)._id).toBeUndefined();
      expect((result as any).userId).toBeUndefined();
    });
  });
});
