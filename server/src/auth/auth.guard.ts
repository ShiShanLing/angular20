import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = await this.authService.authenticateFromCookie(
      request.headers?.cookie,
    );
    if (!session) {
      throw new UnauthorizedException('请先使用 Agent 账号登录。');
    }
    request.user = {
      userId: session.user.id,
      username: session.user.username,
      isSuperAdmin: session.isSuperAdmin,
    };
    return true;
  }
}
