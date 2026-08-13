import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError } from 'rxjs';
import { PermissionService } from './permission.service';

const TOKEN_KEY = 'app.auth.token.v1';
const USER_KEY = 'app.auth.user.v1';
const PERM_KEY = 'app.auth.permissions.v1';
const GUEST_KEY = 'app.auth.guest.v1';

/** 普通用户 / 游客可用权限（不含市场情绪等 admin 专属） */
export const BASIC_PERMISSIONS: string[] = [
  'tools.mortgage', 'tools.salary', 'tools.accounting',
  'tools.subscription', 'tools.saving', 'tools.fire', 'tools.anhui-pension',
  'tools.bmi', 'tools.water', 'tools.weight', 'tools.sleep',
  'tools.time', 'tools.weather', 'tools.calendar', 'tools.text',
  'tools.qrcode', 'tools.notes', 'tools.dev',
  'snake.play', 'tetris.play',
  'chart.showcase',
];

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
 * - 支持游客模式：可进应用，不携带 JWT，写入由拦截器拦截不落库
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly token = signal<string | null>(this.loadToken());
  private readonly user = signal<UserInfo | null>(this.loadUser());
  private readonly permissions = signal<string[]>(this.loadPermissions());
  private readonly guest = signal<boolean>(this.loadGuest());

  readonly isGuest = computed(() => this.guest());
  readonly isLoggedIn = computed(() => {
    if (this.guest()) return false;
    const t = this.token();
    if (!t) return false;
    return !this.isTokenExpired(t);
  });
  /** 已登录或游客，均可进入主应用 */
  readonly canAccessApp = computed(() => this.isLoggedIn() || this.guest());
  readonly currentUser = computed(() => this.user());
  readonly userPermissions = computed(() => this.permissions());

  private readonly permissionService = inject(PermissionService);
  private readonly http = inject(HttpClient);

  constructor() {
    // 启动时若已是游客，同步权限到 PermissionService
    if (this.guest()) {
      this.permissionService.setPermissions(this.permissions());
    } else if (this.token() && this.permissions().length) {
      this.permissionService.setPermissions(this.permissions());
    }
  }

  // MARK: 登录
  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', req).pipe(
      tap((res) => this.persistSession(res))
    );
  }

  // MARK: 注册
  register(username: string, password: string, inviteCode: string, nickname?: string): Observable<unknown> {
    return this.http.post('/api/auth/register', { username, password, inviteCode, nickname });
  }

  // MARK: 游客进入
  // 本地会话，无 JWT；可使用基础功能，使用记录不写后台
  enterAsGuest(): void {
    this.clearStorageSession();
    this.token.set(null);
    this.guest.set(true);
    const guestUser: UserInfo = { id: 0, username: 'guest', nickname: '游客' };
    this.user.set(guestUser);
    this.permissions.set([...BASIC_PERMISSIONS]);
    this.permissionService.setPermissions([...BASIC_PERMISSIONS]);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GUEST_KEY, '1');
      localStorage.setItem(USER_KEY, JSON.stringify(guestUser));
      localStorage.setItem(PERM_KEY, JSON.stringify(BASIC_PERMISSIONS));
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  // MARK: 退出
  logout(): void {
    this.token.set(null);
    this.user.set(null);
    this.permissions.set([]);
    this.guest.set(false);
    this.permissionService.clearPermissions();
    this.clearStorageSession();
  }

  getToken(): string | null {
    if (this.guest()) return null;
    return this.token();
  }

  restoreSession(): void {
    this.guest.set(this.loadGuest());
    this.token.set(this.loadToken());
    this.user.set(this.loadUser());
    const perms = this.loadPermissions();
    this.permissions.set(perms);
    if (perms.length) {
      this.permissionService.setPermissions(perms);
    }
  }

  // MARK: 校验会话
  validateSession(): Observable<boolean> {
    if (this.loadGuest() || this.guest()) {
      this.enterAsGuest();
      return new Observable<boolean>((sub) => {
        sub.next(true);
        sub.complete();
      });
    }

    const t = this.getToken();
    if (!t || this.isTokenExpired(t)) {
      this.logout();
      return new Observable<boolean>((sub) => {
        sub.next(false);
        sub.complete();
      });
    }
    return this.http.get('/api/auth/profile').pipe(
      map(() => true),
      catchError(() => {
        this.logout();
        return new Observable<boolean>((sub) => {
          sub.next(false);
          sub.complete();
        });
      })
    );
  }

  private persistSession(res: LoginResponse): void {
    this.guest.set(false);
    const perms = res.permissions || [];
    this.token.set(res.access_token);
    this.user.set(res.user);
    this.permissions.set(perms);
    this.permissionService.setPermissions(perms);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(GUEST_KEY);
      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      localStorage.setItem(PERM_KEY, JSON.stringify(perms));
    }
  }

  private clearStorageSession(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERM_KEY);
    localStorage.removeItem(GUEST_KEY);
  }

  private loadToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): UserInfo | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as UserInfo) : null;
    } catch {
      return null;
    }
  }

  private loadPermissions(): string[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(PERM_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private loadGuest(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(GUEST_KEY) === '1';
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return false;
      return Date.now() >= (payload.exp - 60) * 1000;
    } catch {
      return true;
    }
  }
}
