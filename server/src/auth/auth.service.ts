import { Injectable, UnauthorizedException, GoneException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { AGENT_COOKIE_NAME, readCookie } from './agent-cookie';

type AgentMeResponse = {
  id: string;
  email: string;
  display_name: string;
  can_access_admin?: boolean;
};

type AgentSession = {
  user: User;
  isSuperAdmin: boolean;
};

const ADMIN_PERMISSIONS = [
  'market.view',
  'practice.view',
  'chart.showcase',
  'snake.play',
  'tetris.play',
  'tools.mortgage', 'tools.salary', 'tools.accounting',
  'tools.subscription', 'tools.saving', 'tools.fire', 'tools.anhui-pension',
  'tools.bmi', 'tools.water', 'tools.weight', 'tools.sleep',
  'tools.time', 'tools.weather', 'tools.calendar', 'tools.text',
  'tools.qrcode', 'tools.notes', 'tools.dev', 'tools.draw',
];

const BASIC_PERMISSIONS = [
  'tools.mortgage', 'tools.salary', 'tools.accounting',
  'tools.subscription', 'tools.saving', 'tools.fire', 'tools.anhui-pension',
  'tools.bmi', 'tools.water', 'tools.weight', 'tools.sleep',
  'tools.time', 'tools.weather', 'tools.calendar', 'tools.text',
  'tools.qrcode', 'tools.notes', 'tools.dev', 'tools.draw',
  'snake.play',
  'tetris.play',
  'chart.showcase',
  'practice.view',
];

@Injectable()
export class AuthService {
  private readonly sessionCache = new Map<
    string,
    { session: AgentSession; expiresAt: number }
  >();

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  register(): never {
    throw new GoneException('请到 Agent 注册统一账号：/agent/');
  }

  login(): never {
    throw new GoneException('请到 Agent 使用统一账号登录：/agent/');
  }

  async authenticateFromCookie(cookieHeader?: string): Promise<AgentSession | null> {
    const token = readCookie(cookieHeader, AGENT_COOKIE_NAME);
    if (!token) {
      return null;
    }

    const cached = this.sessionCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.session;
    }

    const agent = await this.fetchAgentUser(token);
    if (!agent) {
      this.sessionCache.delete(token);
      return null;
    }

    const user = await this.usersService.findOrCreateFromAgent({
      id: agent.id,
      email: agent.email,
      display_name: agent.display_name,
    });
    const session: AgentSession = {
      user,
      isSuperAdmin: Boolean(agent.can_access_admin),
    };
    this.sessionCache.set(token, {
      session,
      expiresAt: Date.now() + 30_000,
    });
    return session;
  }

  async getProfile(userId: number, isSuperAdmin = false) {
    const user = await this.usersService.findById(userId);
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      createdAt: user.createdAt,
      permissions: this.getPermissions(user.username, isSuperAdmin),
    };
  }

  private getPermissions(username: string, isSuperAdmin: boolean): string[] {
    if (isSuperAdmin || username === 'admin') {
      return [...ADMIN_PERMISSIONS];
    }
    return [...BASIC_PERMISSIONS];
  }

  private async fetchAgentUser(token: string): Promise<AgentMeResponse | null> {
    const url = this.configService.get<string>(
      'AGENT_AUTH_ME_URL',
      'http://127.0.0.1:8000/auth/me',
    );
    try {
      const response = await fetch(url, {
        headers: {
          Cookie: `${AGENT_COOKIE_NAME}=${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(4000),
      });
      if (response.status === 401) {
        return null;
      }
      if (!response.ok) {
        throw new UnauthorizedException('无法校验 Agent 登录状态。');
      }
      return (await response.json()) as AgentMeResponse;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('无法连接 Agent 登录服务。');
    }
  }
}
