import { Injectable, inject } from '@angular/core';
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
 * 菜单访问判定服务（权限 + 激活码 + 本地显示设置）。
 * 供 layout 侧栏过滤与 menuAccessGuard 共用，避免多处重复逻辑。
 *
 */
@Injectable({ providedIn: 'root' })
export class MenuAccessService {
  private readonly permissionService = inject(PermissionService);
  private readonly featureActivationService = inject(FeatureActivationService);
  private readonly menuVisibilityService = inject(MenuVisibilityService);

  private readonly leafRoutes: FeatureLeafRoute[] = this.collectLeafRoutes(FEATURE_MENU_ITEMS);

  // MARK: 路径受管
  // 该路径是否在功能菜单中受管（需要做访问校验）。
  isManagedPath(path: string): boolean {
    return this.findManagedRoute(path) !== null;
  }

  // MARK: 路径可访
  // 综合权限、激活码、本地显隐，判断用户是否可访问该路径。
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

  // MARK: 匹配路由
  // 精确匹配或前缀匹配受管菜单路由，如 /market/日期 匹配 /market
  private findManagedRoute(path: string): FeatureLeafRoute | null {
    const exact = this.leafRoutes.find((item) => item.path === path);
    if (exact) return exact;
    return this.leafRoutes.find((item) => path.startsWith(item.path + '/')) ?? null;
  }

  // MARK: 首个可访
  // 返回第一个可访问的菜单路径；都不可用时返回 null。
  firstAccessiblePath(): string | null {
    const match = this.leafRoutes.find((item) => this.hasAccessToPath(item.path));
    return match?.path ?? null;
  }

  // MARK: 收集路由
  // 从菜单树收集所有叶子路由。
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
