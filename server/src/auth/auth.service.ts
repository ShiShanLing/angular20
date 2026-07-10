import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(username: string, password: string, inviteCode: string, nickname?: string) {
    // 校验邀请码
    const validCode = this.configService.get<string>('INVITE_CODE', 'angular20');
    if (inviteCode !== validCode) {
      throw new BadRequestException('邀请码不正确');
    }
    const user = await this.usersService.create(username, password, nickname);
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
    };
  }

  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const isValid = await this.usersService.validatePassword(user, password);
    if (!isValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      createdAt: user.createdAt,
    };
  }
}
