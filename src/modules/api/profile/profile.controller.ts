import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AvatarUpload } from './decorators/avatar-upload.decorator';
import { JwtAuthGuard } from '../../../utils/jwt-auth.guard';
import { plainToInstance } from 'class-transformer';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateInterestsDto } from './dto/update-interests.dto';
import { ProfileService } from './profile.service';
import { ProfileViewModel } from './viewmodels/profile.viewmodel';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string };
}

@Controller('')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('createProfile')
  async createProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProfileDto,
  ) {
    const profile = await this.profileService.createProfile(req.user.sub, dto);
    return plainToInstance(ProfileViewModel, profile);
  }

  @Get('getProfile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const profile = await this.profileService.getProfile(req.user.sub);
    return plainToInstance(ProfileViewModel, profile);
  }

  @Put('updateProfile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.profileService.updateProfile(req.user.sub, dto);
    return plainToInstance(ProfileViewModel, profile);
  }

  @Put('updateInterests')
  async updateInterests(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateInterestsDto,
  ) {
    const profile = await this.profileService.updateInterests(req.user.sub, dto);
    return plainToInstance(ProfileViewModel, profile);
  }

  @Post('uploadAvatar')
  @HttpCode(HttpStatus.OK)
  @AvatarUpload()
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarUrl = await this.profileService.uploadAvatar(req.user.sub, file);
    return { avatarUrl };
  }
}
