import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';

/**
 * 把绝对路径 /api/... 改写到当前 base-href 下。
 * 部署在 /angular20/ 时请求变为 /angular20/api/...；本地 base 为 / 时保持不变。
 */
export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const baseHref =
    inject(APP_BASE_HREF, { optional: true }) ??
    inject(PlatformLocation).getBaseHrefFromDOM() ??
    '/';
  const prefix = baseHref.endsWith('/') ? baseHref.slice(0, -1) : baseHref;
  if (!prefix) {
    return next(req);
  }

  return next(req.clone({ url: `${prefix}${req.url}` }));
};
