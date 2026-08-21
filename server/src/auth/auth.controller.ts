import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @ApiOperation({ summary: '已停用', description: '请到 Agent 注册统一账号' })
  @ApiResponse({ status: 410, description: '请使用 Agent 注册' })
  register(@Body() _dto: RegisterDto) {
    return this.authService.register();
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 600000 } })
  @ApiOperation({ summary: '已停用', description: '请到 Agent 使用统一账号登录' })
  @ApiResponse({ status: 410, description: '请使用 Agent 登录' })
  login(@Body() _dto: LoginDto) {
    return this.authService.login();
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '获取当前 Agent 账号对应的工坊用户信息' })
  getProfile(@Request() req: { user: { userId: number; isSuperAdmin?: boolean } }) {
    return this.authService.getProfile(req.user.userId, Boolean(req.user.isSuperAdmin));
  }
}
