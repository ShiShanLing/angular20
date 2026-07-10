import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'app.auth.token.v1';

/** 全局 HTTP 拦截器：自动附加 JWT token */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
