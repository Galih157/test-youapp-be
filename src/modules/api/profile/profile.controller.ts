import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { AvatarUpload } from './decorators/avatar-upload.decorator';
import { JwtAuthGuard } from '../../../utils/jwt-auth.guard';
import { CurrentUser } from '../../../utils/current-user.decorator';
import type { AuthUser } from '../../../utils/current-user.decorator';
import { plainToInstance } from 'class-transformer';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateInterestsDto } from './dto/update-interests.dto';
import { ProfileService } from './profile.service';
import { ProfileViewModel } from './viewmodels/profile.viewmodel';

@Controller('')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('createProfile')
  async createProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProfileDto,
  ) {
    const profile = await this.profileService.createProfile(user.sub, dto);
    return plainToInstance(ProfileViewModel, profile);
  }

  @Get('getProfile')
  async getProfile(@CurrentUser() user: AuthUser) {
    const profile = await this.profileService.getProfile(user.sub);
    return plainToInstance(ProfileViewModel, profile);
  }

  @Put('updateProfile')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.profileService.updateProfile(user.sub, dto);
    return plainToInstance(ProfileViewModel, profile);
  }

  @Put('updateInterests')
  async updateInterests(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateInterestsDto,
  ) {
    const profile = await this.profileService.updateInterests(user.sub, dto);
    return plainToInstance(ProfileViewModel, profile);
  }

  @Post('uploadAvatar')
  @HttpCode(HttpStatus.OK)
  @AvatarUpload()
  async uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarUrl = await this.profileService.uploadAvatar(user.sub, file);
    return { avatarUrl };
  }
}
