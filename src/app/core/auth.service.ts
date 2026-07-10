import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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

  readonly isLoggedIn = computed(() => !!this.token());
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
}
