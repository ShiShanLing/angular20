import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { PermissionService } from './permission.service';

const TOKEN_KEY = 'app.auth.token.v1';
const USER_KEY = 'app.auth.user.v1';
const PERM_KEY = 'app.auth.permissions.v1';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: UserInfo;
  permissions?: string[];
}

export interface UserInfo {
  id: number;
  username: string;
  nickname?: string;
}

/**
 * 认证服务：
 * - 管理登录态（token + 用户信息），持久化到 localStorage
 * - 提供 login / logout / isLoggedIn 接口
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly token = signal<string | null>(this.loadToken());
  private readonly user = signal<UserInfo | null>(this.loadUser());
  private readonly permissions = signal<string[]>(this.loadPermissions());

  readonly isLoggedIn = computed(() => {
    const t = this.token();
    if (!t) return false;
    // 检查 JWT 是否过期
    return !this.isTokenExpired(t);
  });
  readonly currentUser = computed(() => this.user());
  readonly userPermissions = computed(() => this.permissions());

  private readonly permissionService = inject(PermissionService);
  private readonly http = inject(HttpClient);

  // MARK: 登录
  // 调用登录接口并持久化 token、用户与权限
  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', req).pipe(
      tap((res) => this.persistSession(res))
    );
  }

  // MARK: 注册
  // 调用注册接口，需邀请码
  register(username: string, password: string, inviteCode: string, nickname?: string): Observable<any> {
    return this.http.post('/api/auth/register', { username, password, inviteCode, nickname });
  }

  // MARK: 退出登录
  // 清除本地登录态（不请求后端）
  logout(): void {
    this.token.set(null);
    this.user.set(null);
    this.permissions.set([]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PERM_KEY);
    }
  }

  // MARK: 获取令牌
  // 读取当前 JWT，供拦截器附加 Authorization
  getToken(): string | null {
    return this.token();
  }

  // MARK: 恢复会话
  // 从 localStorage 恢复会话到 signal 与权限服务
  restoreSession(): void {
    this.token.set(this.loadToken());
    this.user.set(this.loadUser());
    const perms = this.loadPermissions();
    this.permissions.set(perms);
    this.permissionService.setPermissions(perms);
  }

  // MARK: 校验会话
  // 启动时请求 /api/auth/profile 校验 token，401 或过期则退出登录
  validateSession(): Observable<boolean> {
    const t = this.getToken();
    if (!t || this.isTokenExpired(t)) {
      this.logout();
      return new Observable<boolean>((sub) => { sub.next(false); sub.complete(); });
    }
    return this.http.get('/api/auth/profile').pipe(
      map(() => true),
      catchError(() => {
        this.logout();
        return new Observable<boolean>((sub) => { sub.next(false); sub.complete(); });
      })
    );
  }

  // ─── private ────────────────────────────────────────────────────────────────

  // MARK: 持久会话
  // 把登录响应写入 signal 与 localStorage
  private persistSession(res: LoginResponse): void {
    const perms = res.permissions || [];
    this.token.set(res.access_token);
    this.user.set(res.user);
    this.permissions.set(perms);
    this.permissionService.setPermissions(perms);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      localStorage.setItem(PERM_KEY, JSON.stringify(perms));
    }
  }

  // MARK: 加载令牌
  // 从 localStorage 读取 token
  private loadToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  // MARK: 加载用户
  // 从 localStorage 读取用户信息
  private loadUser(): UserInfo | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as UserInfo) : null;
    } catch {
      return null;
    }
  }

  // MARK: 加载权限
  // 从 localStorage 读取权限列表
  private loadPermissions(): string[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(PERM_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  // MARK: 令牌过期
  // 解析 JWT exp，提前 60 秒视为过期；解析失败也视为过期
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return false;
      // exp 是秒级时间戳，留 60 秒缓冲
      return Date.now() >= (payload.exp - 60) * 1000;
    } catch {
      return true; // 解析失败视为过期
    }
  }
}
