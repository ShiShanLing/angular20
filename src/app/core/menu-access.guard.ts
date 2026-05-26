import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { MenuAccessService } from './menu-access.service';

/** 访问菜单受管页面时做权限/显示校验；无权则跳首个可访问功能。 */
export const menuAccessGuard: CanActivateChildFn = (_, state) => {
  const router = inject(Router);
  const menuAccessService = inject(MenuAccessService);
  const targetPath = normalizePath(state.url);
  const noAccessPath = '/no-access';

  if (!menuAccessService.isManagedPath(targetPath)) {
    return true;
  }
  if (menuAccessService.hasAccessToPath(targetPath)) {
    return true;
  }

  const fallback = menuAccessService.firstAccessiblePath();
  if (!fallback) {
    if (targetPath === noAccessPath) {
      return true;
    }
    return router.parseUrl(noAccessPath);
  }
  if (fallback === targetPath) {
    return true;
  }
  return router.parseUrl(fallback);
};

function normalizePath(url: string): string {
  const withoutQuery = url.split('?')[0] ?? '';
  const withoutFragment = withoutQuery.split('#')[0] ?? '';
  const trimmed = withoutFragment.trim();
  if (!trimmed) {
    return '/';
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

