import { Module } from '@nestjs/common';
import { RegisterModule } from './register/register.module';
import { LoginModule } from './login/login.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [RegisterModule, LoginModule, ProfileModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
