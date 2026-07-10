import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.username, dto.password, dto.inviteCode, dto.nickname);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 600000 } })
  @ApiOperation({ summary: '用户登录', description: '返回 JWT token，每个 IP 每 10 分钟最多 10 次' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }
}
