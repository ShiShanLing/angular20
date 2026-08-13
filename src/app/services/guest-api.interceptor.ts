import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../core/auth.service';

/** 游客允许访问的公开 API（不落用户数据） */
const GUEST_ALLOW = [
  '/api/weather/geocode',
  '/api/weather/forecast',
];

let lastWarnAt = 0;

function isAllowedForGuest(url: string): boolean {
  return GUEST_ALLOW.some((p) => url.includes(p));
}

function guestEmptyBody(url: string, method: string): unknown {
  const m = method.toUpperCase();
  if (m === 'GET' || m === 'HEAD') {
    if (url.includes('/game-scores/best')) {
      return { score: 0, playedAt: null };
    }
    if (url.includes('/market-reports')) {
      return { items: [], total: 0, page: 1, pageSize: 20 };
    }
    // 列表类默认空数组
    if (
      url.includes('/records') ||
      url.includes('/game-scores') ||
      url.includes('/notes') ||
      url.includes('/notebooks') ||
      url.includes('/weather/history')
    ) {
      return [];
    }
    return {};
  }
  // 写操作：假装成功，不打后端
  return { success: true, guest: true, id: 0 };
}

/**
 * 游客模式：拦截会访问用户数据的 API，不发到后台。
 * 公开天气查询仍放行。
 */
export const guestApiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (!auth.isGuest()) {
    return next(req);
  }

  const url = req.url;
  const isApi = url.includes('/api/') || url.startsWith('/api');
  if (!isApi || isAllowedForGuest(url)) {
    return next(req);
  }

  const method = req.method.toUpperCase();
  const isWrite = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
  if (isWrite) {
    const now = Date.now();
    if (now - lastWarnAt > 4000) {
      lastWarnAt = now;
      inject(NzMessageService).info('游客模式：使用记录不会保存到服务器');
    }
  }

  return of(
    new HttpResponse({
      status: 200,
      body: guestEmptyBody(url, method),
    }),
  );
};
