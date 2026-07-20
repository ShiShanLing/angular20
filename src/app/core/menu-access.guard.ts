import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { MenuAccessService } from './menu-access.service';

/** 访问菜单受管页面时做权限/显示校验；无权则跳首个可访问功能。 */
export const menuAccessGuard: CanActivateChildFn = (_, state) => {
  const router = inject(Router);
  const menuAccessService = inject(MenuAccessService);
  const targetPath = normalizePath(state.url);
  const noAccessPath = '/no-access';

  console.log('[GUARD] targetPath:', targetPath);

  const isManaged = menuAccessService.isManagedPath(targetPath);
  console.log('[GUARD] isManagedPath:', isManaged);

  if (!isManaged) {
    console.log('[GUARD] → 非受管路径，放行');
    return true;
  }

  const hasAccess = menuAccessService.hasAccessToPath(targetPath);
  console.log('[GUARD] hasAccessToPath:', hasAccess);

  if (hasAccess) {
    console.log('[GUARD] → 有权限，放行');
    return true;
  }

  const fallback = menuAccessService.firstAccessiblePath();
  console.log('[GUARD] → 无权限！fallback:', fallback);
  if (!fallback) {
    if (targetPath === noAccessPath) {
      return true;
    }
    return router.parseUrl(noAccessPath);
  }
  if (fallback === targetPath) {
    return true;
  }
  console.log('[GUARD] → 重定向到:', fallback);
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

