import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChineseZodiacYear,
  ChineseZodiacYearDocument,
} from '../../../models/chinese-zodiac-year.schema';
import { Profile, ProfileDocument } from '../../../models/profile.schema';
import { getHoroscope } from '../../../utils/astrology';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(ChineseZodiacYear.name)
    private readonly chineseZodiacYearModel: Model<ChineseZodiacYearDocument>,
  ) {}

  /**
   * Resolves the Chinese zodiac animal for a given date by querying the
   * chinese_zodiac_years collection.  Falls back to the year-based algorithm
   * when no matching record is found (e.g. the collection has not yet been
   * seeded for that year).
   */
  async getZodiacForDate(date: Date): Promise<string | null> {
    const record = await this.chineseZodiacYearModel
      .findOne({ start: { $lte: date }, end: { $gte: date } })
      .lean()
      .exec();
    return record ? record.animal : null;
  }

  async createProfile(userId: string, dto: CreateProfileDto) {
    const existing = await this.profileModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (existing) throw new ConflictException('Profile already exists');

    const profileData: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      ...dto,
    };

    if (dto.birthday) {
      const date = new Date(dto.birthday);
      profileData.horoscope = getHoroscope(date);
      profileData.zodiac = await this.getZodiacForDate(date);
    }

    return this.profileModel.create(profileData);
  }

  async getProfile(userId: string) {
    const profile = await this.profileModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updateData: Record<string, unknown> = { ...dto };

    if (dto.birthday) {
      const date = new Date(dto.birthday);
      updateData.horoscope = getHoroscope(date);
      updateData.zodiac = await this.getZodiacForDate(date);
    }

    const profile = await this.profileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: updateData },
      { new: true },
    );
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${userId}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    try {
      fs.writeFileSync(filepath, file.buffer);
    } catch {
      throw new InternalServerErrorException('Failed to save avatar');
    }

    const avatarPath = `/uploads/avatars/${filename}`;

    await this.profileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { avatar: avatarPath } },
      { new: true },
    );

    return this.toAvatarUrl(avatarPath);
  }

  private toAvatarUrl(relativePath: string): string {
    const base = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    return `${base}${relativePath}`;
  }
}
