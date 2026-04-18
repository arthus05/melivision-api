import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AppTokenService } from './app-token.service';

@Module({
  imports: [HttpModule],
  controllers: [AuthController],
  providers: [AuthService, AppTokenService],
  exports: [AuthService, AppTokenService],
})
export class AuthModule {}
