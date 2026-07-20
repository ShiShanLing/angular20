import { Injectable } from '@angular/core';
import { FEATURE_MENU_ITEMS, type FeatureMenuItem } from './feature-menu';
import { FeatureActivationService } from './feature-activation.service';
import { MenuVisibilityService } from './menu-visibility.service';
import { PermissionService } from './permission.service';

interface FeatureLeafRoute {
  path: string;
  permission?: string;
  activationCode?: string;
}

/**
 * 菜单访问判定（权限 + 本地显示设置）：
 * - 为路由守卫提供统一入口
 * - 避免在多处重复菜单访问逻辑
 */
@Injectable({ providedIn: 'root' })
export class MenuAccessService {
  private readonly leafRoutes: FeatureLeafRoute[] = this.collectLeafRoutes(FEATURE_MENU_ITEMS);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly featureActivationService: FeatureActivationService,
    private readonly menuVisibilityService: MenuVisibilityService,
  ) {}

  isManagedPath(path: string): boolean {
    return this.findManagedRoute(path) !== null;
  }

  hasAccessToPath(path: string): boolean {
    const route = this.findManagedRoute(path);
    if (!route) {
      return true;
    }
    console.log('[MENU-ACCESS] matched route:', route.path, 'permission:', route.permission, 'activationCode:', route.activationCode);
    const permOk = this.permissionService.hasPermission(route.permission);
    const activeOk = this.featureActivationService.isActive(route.activationCode);
    const visibleOk = this.menuVisibilityService.isVisible(route.path);
    console.log('[MENU-ACCESS] perm:', permOk, 'active:', activeOk, 'visible:', visibleOk);
    return permOk && activeOk && visibleOk;
  }

  /** 精确匹配或子路由匹配：/market/2026-07-17 匹配到 /market */
  private findManagedRoute(path: string): FeatureLeafRoute | null {
    // 1. 精确匹配
    const exact = this.leafRoutes.find((item) => item.path === path);
    if (exact) return exact;
    // 2. 子路由匹配：/market/xxx → 匹配 /market
    return this.leafRoutes.find((item) => path.startsWith(item.path + '/')) ?? null;
  }

  firstAccessiblePath(): string | null {
    const match = this.leafRoutes.find((item) => this.hasAccessToPath(item.path));
    return match?.path ?? null;
  }

  private collectLeafRoutes(items: FeatureMenuItem[]): FeatureLeafRoute[] {
    const result: FeatureLeafRoute[] = [];
    for (const item of items) {
      if (item.children?.length) {
        result.push(...this.collectLeafRoutes(item.children));
      } else if (item.path) {
        result.push({
          path: item.path,
          permission: item.permission,
          activationCode: item.activationCode,
        });
      }
    }
    return result;
  }
}
