import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';
import { PermissionService } from '../core/permission.service';
import { FeatureActivationService } from '../core/feature-activation.service';
import { MenuVisibilityService } from '../core/menu-visibility.service';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';
import { FEATURE_MENU_ITEMS, type FeatureMenuItem } from '../core/feature-menu';

type MenuItem = FeatureMenuItem;

interface MenuSettingsGroup {
  label: string;
  children: Array<{ path: string; label: string }>;
}

/** 壳布局：顶栏、侧栏多级菜单、移动端抽屉与主区域 `<router-outlet>`。 */
@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    FormsModule,
    RouterOutlet,
    RouterLink,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzTooltipModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly permissionService = inject(PermissionService);
  private readonly featureActivationService = inject(FeatureActivationService);
  private readonly menuVisibilityService = inject(MenuVisibilityService);
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  /** 桌面端侧边栏折叠状态（移动端不使用）。 */
  readonly isCollapsed = signal(false);

  /**
   * 是否移动端视口（≤768px）。
   * 首帧用 matchMedia 同步，避免 observe 异步首包前误渲染桌面 sider。
   */
  readonly isMobile = signal(
    typeof matchMedia !== 'undefined' ? matchMedia('(max-width: 768px)').matches : false,
  );

  /** 移动端抽屉是否打开。 */
  readonly isMobileDrawerOpen = signal(false);

  /** 菜单显示设置面板是否打开。 */
  readonly isMenuSettingsOpen = signal(false);

  readonly activationCode = signal('');
  readonly activationMessage = signal('');
  readonly activationMessageType = signal<'success' | 'error' | ''>('');

  readonly menuItems: MenuItem[] = FEATURE_MENU_ITEMS;

  /** 权限 + 激活码过滤后的菜单（设置面板与侧栏共用上游）。 */
  private readonly availableMenuItems = computed(() =>
    this.filterByPermissionAndActivation(this.menuItems),
  );

  /** 再叠加本地显隐后的侧栏菜单。 */
  readonly visibleMenuItems = computed(() => this.filterByVisibility(this.availableMenuItems()));

  /** 设置面板分组（仅展示已有权限/已激活的叶子项）。 */
  readonly menuSettingsGroups = computed<MenuSettingsGroup[]>(() =>
    this.availableMenuItems()
      .map((item) => ({
        label: item.label,
        children: (item.children ?? [])
          .filter((child): child is MenuItem & { path: string } => typeof child.path === 'string')
          .map((child) => ({ path: child.path, label: child.label })),
      }))
      .filter((group) => group.children.length > 0),
  );

  // MARK: 构造注入
  // 订阅断点与路由；组件销毁时自动取消
  constructor() {
    if (this.isMobile()) {
      this.isMobileDrawerOpen.set(false);
    }

    this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .pipe(takeUntilDestroyed())
      .subscribe((result) => {
        this.isMobile.set(result.matches);
        if (result.matches) {
          this.isMobileDrawerOpen.set(false);
        }
      });
      
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.isMobile()) {
          this.isMobileDrawerOpen.set(false);
        }
        this.isMenuSettingsOpen.set(false);
        this.ensureCurrentRouteVisible();
      });

    this.ensureCurrentRouteVisible();
  }

  // MARK: 退出登录
  // 清除 session 并跳转到登录页
  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }

  // MARK: 切换菜单
  // Header 按钮：移动端开关抽屉，桌面端折叠/展开侧栏
  toggleMenu(): void {
    if (this.isMobile()) {
      this.isMobileDrawerOpen.update((open) => !open);
    } else {
      this.isCollapsed.update((collapsed) => !collapsed);
    }
  }

  // MARK: 菜单设置
  // 打开或关闭菜单显示设置面板
  toggleMenuSettings(): void {
    this.isMenuSettingsOpen.update((open) => !open);
  }

  // MARK: 关闭设置
  // 关闭菜单显示设置面板
  closeMenuSettings(): void {
    this.isMenuSettingsOpen.set(false);
  }

  // MARK: 关闭抽屉
  // 关闭移动端侧栏抽屉
  closeMobileDrawer(): void {
    this.isMobileDrawerOpen.set(false);
  }

  // MARK: 显隐变更
  // 勾选变更时更新本地菜单显隐，并校正当前路由
  onMenuVisibleChange(path: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.menuVisibilityService.setVisible(path, checked);
    this.ensureCurrentRouteVisible();
  }

  // MARK: 菜单可见
  // 读取本地设置，判断菜单路径是否显示
  isMenuPathVisible(path: string): boolean {
    return this.menuVisibilityService.isVisible(path);
  }

  // MARK: 重置显隐
  // 清空本地隐藏项并校正当前路由
  resetMenuVisibility(): void {
    this.menuVisibilityService.reset();
    this.ensureCurrentRouteVisible();
  }

  // MARK: 激活功能
  // 校验激活码：999 解锁刷题相关，888 取消解锁
  activateFeatures(): void {
    const code = this.activationCode().trim();
    if (code === '999') {
      this.featureActivationService.activate(code);
      this.activationCode.set('');
      this.activationMessage.set('已解锁知识刷题、iOS学习、Angular学习');
      this.activationMessageType.set('success');
      this.ensureCurrentRouteVisible();
      return;
    }
    if (code === '888') {
      this.featureActivationService.deactivate('999');
      this.activationCode.set('');
      this.activationMessage.set('');
      this.activationMessageType.set('');
      this.ensureCurrentRouteVisible();
      return;
    }

    this.activationMessage.set('激活码不正确');
    this.activationMessageType.set('error');
  }

  // MARK: 权限过滤
  // 按权限与激活码递归过滤菜单树
  private filterByPermissionAndActivation(items: MenuItem[]): MenuItem[] {
    return items
      .map((item) => {
        const hasSelfPermission = this.permissionService.hasPermission(item.permission);
        const isActivated = this.featureActivationService.isActive(item.activationCode);
        const filteredChildren = item.children
          ? this.filterByPermissionAndActivation(item.children)
          : undefined;

        if (filteredChildren) {
          if (!hasSelfPermission || !isActivated || filteredChildren.length === 0) {
            return null;
          }
          return { ...item, children: filteredChildren };
        }
        if (!hasSelfPermission || !isActivated) {
          return null;
        }
        return item;
      })
      .filter((item): item is MenuItem => item !== null);
  }

  // MARK: 显隐过滤
  // 按本地显隐设置递归过滤菜单树
  private filterByVisibility(items: MenuItem[]): MenuItem[] {
    return items
      .map((item) => {
        const visibleBySetting = this.menuVisibilityService.isVisible(item.path);
        const filteredChildren = item.children ? this.filterByVisibility(item.children) : undefined;

        if (filteredChildren) {
          if (filteredChildren.length === 0) {
            return null;
          }
          return { ...item, children: filteredChildren };
        }

        if (!visibleBySetting) {
          return null;
        }
        return item;
      })
      .filter((item): item is MenuItem => item !== null);
  }

  // MARK: 路由可见
  // 当前路由不可见或无菜单时，跳到首个可见页或无权限页
  private ensureCurrentRouteVisible(): void {
    const currentPath = this.normalizePath(this.router.url);
    const managedPaths = this.collectLeafPaths(this.availableMenuItems());
    const visiblePaths = this.collectLeafPaths(this.visibleMenuItems());
    const firstVisiblePath = visiblePaths[0];

    if (!firstVisiblePath) {
      if (
        currentPath !== '/no-access' &&
        (currentPath === '' ||
          currentPath === '/' ||
          currentPath === '/tools' ||
          managedPaths.includes(currentPath))
      ) {
        void this.router.navigateByUrl('/no-access', { replaceUrl: true });
      }
      return;
    }

    if (
      currentPath === '' ||
      currentPath === '/' ||
      currentPath === '/tools' ||
      !visiblePaths.includes(currentPath)
    ) {
      if (currentPath !== firstVisiblePath) {
        void this.router.navigateByUrl(firstVisiblePath, { replaceUrl: true });
      }
    }
  }

  // MARK: 收集路径
  // 递归收集菜单树中的叶子路径
  private collectLeafPaths(items: MenuItem[]): string[] {
    const paths: string[] = [];
    for (const item of items) {
      if (item.children?.length) {
        paths.push(...this.collectLeafPaths(item.children));
      } else if (item.path) {
        paths.push(item.path);
      }
    }
    return paths;
  }

  // MARK: 规范路径
  // 去掉 query/hash，规范路径格式
  private normalizePath(url: string): string {
    const withoutQuery = url.split('?')[0] ?? '';
    const withoutFragment = withoutQuery.split('#')[0] ?? '';
    const trimmed = withoutFragment.trim();
    if (!trimmed) {
      return '/';
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
}
