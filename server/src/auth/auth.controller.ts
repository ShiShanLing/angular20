import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 注册：每个 IP 每 10 分钟最多 3 次
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.username, dto.password, dto.inviteCode, dto.nickname);
  }

  // 登录：每个 IP 每 10 分钟最多 10 次（防暴力破解）
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 600000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }
}
