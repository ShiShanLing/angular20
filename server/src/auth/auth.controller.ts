import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: '用户注册', description: '需要邀请码，每个 IP 每 10 分钟最多 3 次' })
  @ApiResponse({ status: 201, description: '注册成功', schema: { example: { message: '注册成功', userId: 1 } } })
  @ApiResponse({ status: 400, description: '参数错误', schema: { example: { message: '邀请码无效' } } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.username, dto.password, dto.inviteCode, dto.nickname);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 600000 } })
  @ApiOperation({ summary: '用户登录', description: '返回 JWT token，每个 IP 每 10 分钟最多 10 次' })
  @ApiResponse({
    status: 200,
    description: '登录成功，返回 token',
    schema: { example: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', userId: 1, username: 'admin', nickname: '管理员' } },
  })
  @ApiResponse({ status: 401, description: '密码错误', schema: { example: { message: '用户名或密码错误' } } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '返回当前登录用户信息',
    schema: { example: { id: 1, username: 'admin', nickname: '管理员', createdAt: '2026-01-01T00:00:00.000Z' } },
  })
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }
}
