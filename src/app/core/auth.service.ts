import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { PermissionService } from './permission.service';

const USER_KEY = 'app.auth.user.v1';
const PERM_KEY = 'app.auth.permissions.v1';
const GUEST_KEY = 'app.auth.guest.v1';
const LOCAL_DEV_KEY = 'app.auth.local_dev.v1';

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

const LOCAL_DEV_PERMISSIONS: string[] = [
  ...BASIC_PERMISSIONS,
  'practice.view',
  'market.view',
];

export interface UserInfo {
  id: number;
  username: string;
  nickname?: string;
}

type ProfileResponse = UserInfo & {
  permissions?: string[];
};

/**
 * 认证服务：
 * - 登录态来自 Agent Cookie，由 Nest 的 /api/auth/profile 识别
 * - 支持游客模式：可进应用，不携带登录 Cookie，写入由拦截器拦截不落库
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user = signal<UserInfo | null>(this.loadUser());
  private readonly permissions = signal<string[]>(this.loadPermissions());
  private readonly guest = signal<boolean>(this.loadGuest());
  private readonly localDev = signal<boolean>(this.loadLocalDev());

  readonly isGuest = computed(() => this.guest());
  readonly isLocalDevMode = computed(() => this.localDev());
  readonly isLoggedIn = computed(() => !this.guest() && this.user() !== null && this.user()!.id > 0);
  readonly canAccessApp = computed(() => this.isLoggedIn() || this.guest());
  readonly currentUser = computed(() => this.user());
  readonly userPermissions = computed(() => this.permissions());
  readonly isLocalDev = computed(() => this.isLocalDevHost());

  private readonly permissionService = inject(PermissionService);
  private readonly http = inject(HttpClient);

  constructor() {
    if (this.localDev() && this.isLocalDevHost()) {
      this.permissionService.setPermissions(this.permissions());
    } else if (this.guest()) {
      this.permissionService.setPermissions(this.permissions());
    } else if (this.user() && this.permissions().length) {
      this.permissionService.setPermissions(this.permissions());
    }
  }

  goToAgentLogin(returnUrl = '/'): void {
    const hashPath = returnUrl.startsWith('#')
      ? returnUrl
      : `#${returnUrl.startsWith('/') ? returnUrl : `/${returnUrl}`}`;
    const isLocalDev =
      typeof window !== 'undefined' &&
      ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const next = isLocalDev ? `/${hashPath}` : `/angular20/${hashPath}`;
    window.location.assign(`/agent/?next=${encodeURIComponent(next)}`);
  }

  enterAsGuest(): void {
    this.clearStorageSession();
    this.guest.set(true);
    this.localDev.set(false);
    const guestUser: UserInfo = { id: 0, username: 'guest', nickname: '游客' };
    this.user.set(guestUser);
    this.permissions.set([...BASIC_PERMISSIONS]);
    this.permissionService.setPermissions([...BASIC_PERMISSIONS]);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GUEST_KEY, '1');
      localStorage.setItem(USER_KEY, JSON.stringify(guestUser));
      localStorage.setItem(PERM_KEY, JSON.stringify(BASIC_PERMISSIONS));
    }
  }

  enterAsLocalDev(): boolean {
    if (!this.isLocalDevHost()) {
      return false;
    }
    this.clearStorageSession();
    this.guest.set(false);
    this.localDev.set(true);
    const devUser: UserInfo = { id: 1, username: 'local-dev', nickname: '本地开发' };
    this.user.set(devUser);
    this.permissions.set([...LOCAL_DEV_PERMISSIONS]);
    this.permissionService.setPermissions([...LOCAL_DEV_PERMISSIONS]);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(devUser));
      localStorage.setItem(PERM_KEY, JSON.stringify(LOCAL_DEV_PERMISSIONS));
      localStorage.setItem(LOCAL_DEV_KEY, '1');
    }
    return true;
  }

  async logout(): Promise<void> {
    const wasGuest = this.guest();
    const wasLocalDev = this.localDev();
    this.user.set(null);
    this.permissions.set([]);
    this.guest.set(false);
    this.localDev.set(false);
    this.permissionService.clearPermissions();
    this.clearStorageSession();
    if (!wasGuest && !wasLocalDev) {
      try {
        await fetch('/agent/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // 本地会话已清，忽略网络失败
      }
    }
  }

  restoreSession(): void {
    this.guest.set(this.loadGuest());
    this.localDev.set(this.loadLocalDev() && this.isLocalDevHost());
    this.user.set(this.loadUser());
    const perms = this.loadPermissions();
    this.permissions.set(perms);
    if (perms.length) {
      this.permissionService.setPermissions(perms);
    }
  }

  validateSession(): Observable<boolean> {
    if (this.loadLocalDev() && this.isLocalDevHost()) {
      return of(this.enterAsLocalDev());
    }

    if (this.loadGuest() || this.guest()) {
      this.enterAsGuest();
      return of(true);
    }

    return this.http.get<ProfileResponse>('/api/auth/profile').pipe(
      tap((profile) => this.persistProfile(profile)),
      map(() => true),
      catchError(() => {
        this.clearLoggedInState();
        return of(false);
      }),
    );
  }

  private persistProfile(profile: ProfileResponse): void {
    this.guest.set(false);
    this.localDev.set(false);
    const perms = profile.permissions || [];
    const user: UserInfo = {
      id: profile.id,
      username: profile.username,
      nickname: profile.nickname,
    };
    this.user.set(user);
    this.permissions.set(perms);
    this.permissionService.setPermissions(perms);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(GUEST_KEY);
      localStorage.removeItem(LOCAL_DEV_KEY);
      localStorage.removeItem('app.auth.token.v1');
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(PERM_KEY, JSON.stringify(perms));
    }
  }

  private clearLoggedInState(): void {
    this.user.set(null);
    this.permissions.set([]);
    this.guest.set(false);
    this.localDev.set(false);
    this.permissionService.clearPermissions();
    this.clearStorageSession();
  }

  private clearStorageSession(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('app.auth.token.v1');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERM_KEY);
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(LOCAL_DEV_KEY);
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

  private loadLocalDev(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(LOCAL_DEV_KEY) === '1';
  }

  private isLocalDevHost(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return ['localhost', '127.0.0.1'].includes(window.location.hostname);
  }
}
