import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';

const TOKEN_KEY = 'app.auth.token.v1';
const USER_KEY = 'app.auth.user.v1';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: UserInfo;
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

  readonly isLoggedIn = computed(() => {
    const t = this.token();
    if (!t) return false;
    // 检查 JWT 是否过期
    return !this.isTokenExpired(t);
  });
  readonly currentUser = computed(() => this.user());

  constructor(private readonly http: HttpClient) {}

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', req).pipe(
      tap((res) => this.persistSession(res))
    );
  }

  register(username: string, password: string, inviteCode: string, nickname?: string): Observable<any> {
    return this.http.post('/api/auth/register', { username, password, inviteCode, nickname });
  }

  logout(): void {
    this.token.set(null);
    this.user.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  getToken(): string | null {
    return this.token();
  }

  restoreSession(): void {
    this.token.set(this.loadToken());
    this.user.set(this.loadUser());
  }

  /**
   * 启动时验证 token 有效性：调用后端 /api/auth/profile
   * 如果返回 401（token 过期/无效），清除本地登录态
   */
  validateSession(): Observable<boolean> {
    const t = this.getToken();
    if (!t || this.isTokenExpired(t)) {
      this.logout();
      return new Observable<boolean>((sub) => { sub.next(false); sub.complete(); });
    }
    return this.http.get('/api/auth/profile').pipe(
      tap(() => {}),
      map(() => true),
      catchError(() => {
        this.logout();
        return new Observable<boolean>((sub) => { sub.next(false); sub.complete(); });
      })
    );
  }

  // ─── private ────────────────────────────────────────────────────────────────

  private persistSession(res: LoginResponse): void {
    this.token.set(res.access_token);
    this.user.set(res.user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
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

  /**
   * 解析 JWT payload 检查是否过期
   */
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
