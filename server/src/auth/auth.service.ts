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
    const permissions = this.getPermissions(user.username);
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
      },
      permissions,
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      createdAt: user.createdAt,
      permissions: this.getPermissions(user.username),
    };
  }

  /**
   * 根据用户名返回权限列表
   * admin 拥有所有权限，其他用户拥有基础权限
   */
  private getPermissions(username: string): string[] {
    if (username === 'admin') {
      return [
        'market.view',
        'practice.view',
        'chart.showcase',
        'snake.play',
        'tetris.play',
        'tools.mortgage', 'tools.salary', 'tools.accounting',
        'tools.subscription', 'tools.saving', 'tools.fire', 'tools.anhui-pension',
        'tools.bmi', 'tools.water', 'tools.weight', 'tools.sleep',
        'tools.time', 'tools.weather', 'tools.calendar', 'tools.text',
        'tools.qrcode', 'tools.notes', 'tools.dev',
      ];
    }
    // 普通用户：基础权限（不含市场情绪）
    return [
      'tools.mortgage', 'tools.salary', 'tools.accounting',
      'tools.subscription', 'tools.saving', 'tools.fire', 'tools.anhui-pension',
      'tools.bmi', 'tools.water', 'tools.weight', 'tools.sleep',
      'tools.time', 'tools.weather', 'tools.calendar', 'tools.text',
      'tools.qrcode', 'tools.notes', 'tools.dev',
      'snake.play', 'tetris.play',
    ];
  }
}
