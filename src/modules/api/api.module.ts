import { Module } from '@nestjs/common';
import { RegisterModule } from './register/register.module';
import { LoginModule } from './login/login.module';
import { ProfileModule } from './profile/profile.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [RegisterModule, LoginModule, ProfileModule, ChatModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
