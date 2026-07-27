import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'app.auth.token.v1';

// MARK: 附加令牌
// 全局 HTTP 拦截器。
// 为每个出站请求自动附加 JWT：Authorization: Bearer <token>。
// 与 AuthService 使用同一 localStorage key，保证登录后立即生效。
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
