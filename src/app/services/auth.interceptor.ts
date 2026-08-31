import { HttpInterceptorFn } from '@angular/common/http';

// 本站 API 带上 Agent 登录 Cookie；不再附加 JWT。
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApi = req.url.includes('/api/') || req.url.startsWith('/api') || req.url.includes('/agent/api/');
  if (!isApi) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};
