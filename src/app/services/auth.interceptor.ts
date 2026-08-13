import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'app.auth.token.v1';

// MARK: 附加令牌
// 全局 HTTP 拦截器。
// 为每个出站请求自动附加 JWT：Authorization: Bearer <token>。
// 与 AuthService 使用同一 localStorage key，保证登录后立即生效。
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  // 仅给本站 API 附加 JWT；外链加 Authorization 会触发 CORS 预检（如 DataV OPTIONS 403）
  const isApi = req.url.includes('/api/') || req.url.startsWith('/api');
  if (token && isApi) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
