import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ChineseZodiacYear } from '../../../models/chinese-zodiac-year.schema';
import { Profile } from '../../../models/profile.schema';
import { Gender } from '../../../enums/gender.enum';
import { ProfileService } from './profile.service';

const userId = '507f1f77bcf86cd799439011';

const mockProfile = {
  _id: 'profile-id-1',
  userId: new Types.ObjectId(userId),
  displayName: 'Test User',
  gender: Gender.Male,
  height: 175,
  weight: 70,
  interests: [],
};

const mockProfileModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

/** Builds a chainable findOne mock: .findOne().lean().exec() */
function zodiacFindOne(animal: string | null) {
  return jest.fn().mockReturnValue({
    lean: () => ({
      exec: () => Promise.resolve(animal ? { animal } : null),
    }),
  });
}

const mockChineseZodiacYearModel = {
  findOne: zodiacFindOne(null),
};

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getModelToken(Profile.name), useValue: mockProfileModel },
        {
          provide: getModelToken(ChineseZodiacYear.name),
          useValue: mockChineseZodiacYearModel,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    jest.clearAllMocks();
    // reset to a "no record found" default between tests
    mockChineseZodiacYearModel.findOne = zodiacFindOne(null);
  });

  describe('getZodiacForDate', () => {
    it('should return the animal when a matching record exists in the DB', async () => {
      mockChineseZodiacYearModel.findOne = zodiacFindOne('Dragon');

      const result = await service.getZodiacForDate(new Date('1988-04-05'));

      expect(result).toBe('Dragon');
    });

    it('should return null when no matching record is found', async () => {
      mockChineseZodiacYearModel.findOne = zodiacFindOne(null);

      const result = await service.getZodiacForDate(new Date('1988-04-05'));

      expect(result).toBeNull();
    });

    it('should query with the correct date range filter', async () => {
      mockChineseZodiacYearModel.findOne = zodiacFindOne('Dragon');
      const date = new Date('1988-04-05');

      await service.getZodiacForDate(date);

      expect(mockChineseZodiacYearModel.findOne).toHaveBeenCalledWith({
        start: { $lte: date },
        end: { $gte: date },
      });
    });
  });

  describe('createProfile', () => {
    it('should create and return a profile', async () => {
      mockProfileModel.findOne.mockResolvedValue(null);
      mockProfileModel.create.mockResolvedValue(mockProfile);

      const result = await service.createProfile(userId, {
        displayName: 'Test User',
        height: 175,
        weight: 70,
      });

      expect(mockProfileModel.findOne).toHaveBeenCalled();
      expect(mockProfileModel.create).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it('should persist the gender enum value', async () => {
      const profileWithGender = { ...mockProfile, gender: Gender.Female };
      mockProfileModel.findOne.mockResolvedValue(null);
      mockProfileModel.create.mockResolvedValue(profileWithGender);

      const result = await service.createProfile(userId, { gender: Gender.Female });

      const createArg = mockProfileModel.create.mock.calls[0][0];
      expect(createArg.gender).toBe(Gender.Female);
      expect(result.gender).toBe(Gender.Female);
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockProfileModel.findOne.mockResolvedValue(mockProfile);

      await expect(
        service.createProfile(userId, { displayName: 'Test User' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should compute horoscope from birthday and look up zodiac in the DB', async () => {
      mockChineseZodiacYearModel.findOne = zodiacFindOne('Dragon');
      mockProfileModel.findOne.mockResolvedValue(null);
      mockProfileModel.create.mockResolvedValue(mockProfile);

      await service.createProfile(userId, { birthday: '1988-04-05' });

      const createArg = mockProfileModel.create.mock.calls[0][0];
      expect(createArg.horoscope).toBe('Aries');
      expect(createArg.zodiac).toBe('Dragon');
    });

    it('should set zodiac to null when no DB record is found for birthday', async () => {
      mockChineseZodiacYearModel.findOne = zodiacFindOne(null);
      mockProfileModel.findOne.mockResolvedValue(null);
      mockProfileModel.create.mockResolvedValue(mockProfile);

      await service.createProfile(userId, { birthday: '1988-04-05' });

      const createArg = mockProfileModel.create.mock.calls[0][0];
      expect(createArg.zodiac).toBeNull();
    });

    it('should not set horoscope or zodiac when no birthday is provided', async () => {
      mockProfileModel.findOne.mockResolvedValue(null);
      mockProfileModel.create.mockResolvedValue(mockProfile);

      await service.createProfile(userId, { displayName: 'Test User' });

      const createArg = mockProfileModel.create.mock.calls[0][0];
      expect(createArg.horoscope).toBeUndefined();
      expect(createArg.zodiac).toBeUndefined();
    });
  });

  describe('getProfile', () => {
    it('should return the profile for a user', async () => {
      mockProfileModel.findOne.mockResolvedValue(mockProfile);

      const result = await service.getProfile(userId);

      expect(mockProfileModel.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockProfileModel.findOne.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update and return the profile', async () => {
      const updated = { ...mockProfile, displayName: 'Updated Name' };
      mockProfileModel.findOneAndUpdate.mockResolvedValue(updated);

      const result = await service.updateProfile(userId, {
        displayName: 'Updated Name',
      });

      expect(mockProfileModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockProfileModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, { displayName: 'Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should recompute horoscope and look up zodiac in DB when birthday is updated', async () => {
      mockChineseZodiacYearModel.findOne = zodiacFindOne('Dragon');
      const updated = {
        ...mockProfile,
        birthday: new Date('1988-04-05'),
        horoscope: 'Aries',
        zodiac: 'Dragon',
      };
      mockProfileModel.findOneAndUpdate.mockResolvedValue(updated);

      await service.updateProfile(userId, { birthday: '1988-04-05' });

      const [, updateArg] = mockProfileModel.findOneAndUpdate.mock.calls[0];
      expect(updateArg.$set.horoscope).toBe('Aries');
      expect(updateArg.$set.zodiac).toBe('Dragon');
    });

    it('should set zodiac to null when no DB record is found during update', async () => {
      mockChineseZodiacYearModel.findOne = zodiacFindOne(null);
      mockProfileModel.findOneAndUpdate.mockResolvedValue(mockProfile);

      await service.updateProfile(userId, { birthday: '1988-04-05' });

      const [, updateArg] = mockProfileModel.findOneAndUpdate.mock.calls[0];
      expect(updateArg.$set.zodiac).toBeNull();
    });
  });
});
