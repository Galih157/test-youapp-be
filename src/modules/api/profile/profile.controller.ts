import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../utils/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string };
}

@Controller('')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('createProfile')
  createProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProfileDto,
  ) {
    return this.profileService.createProfile(req.user.sub, dto);
  }

  @Get('getProfile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.profileService.getProfile(req.user.sub);
  }

  @Put('updateProfile')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(req.user.sub, dto);
  }
}
