import { Module } from '@nestjs/common';
import { RegisterModule } from './register/register.module';
import { LoginModule } from './login/login.module';

@Module({
  imports: [RegisterModule, LoginModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
