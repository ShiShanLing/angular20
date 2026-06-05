import { Component, OnInit, OnDestroy, computed } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
// BreakpointObserver 来自 Angular CDK，用于监听媒体查询断点变化
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PermissionService } from '../core/permission.service';
import { FeatureActivationService } from '../core/feature-activation.service';
import { MenuVisibilityService } from '../core/menu-visibility.service';
import { FEATURE_MENU_ITEMS, type FeatureMenuItem } from '../core/feature-menu';

type MenuItem = FeatureMenuItem;

interface MenuSettingsGroup {
  label: string;
  children: Array<{ path: string; label: string }>;
}

/** 壳布局：顶栏、侧栏多级菜单、移动端抽屉与主区域 `<router-outlet>`。 */
@Component({
  selector: 'app-layout',
  imports: [
    NgTemplateOutlet,   // 用于在模板中复用 ng-template（桌面 sider 与移动抽屉共享同一份菜单）
    FormsModule,
    RouterOutlet,
    RouterLink,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzToolTipModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  // 桌面端侧边栏折叠状态（移动端不使用此状态）
  isCollapsed = false;

  // 当前是否处于移动端视口（≤768px）
  isMobile = false;

  // 移动端抽屉是否打开
  isMobileDrawerOpen = false;

  // 菜单显示设置面板是否打开
  isMenuSettingsOpen = false;

  activationCode = '';
  activationMessage = '';
  activationMessageType: 'success' | 'error' | '' = '';

  // 统一管理所有订阅，在 ngOnDestroy 中一次性取消，防止内存泄漏
  private subs = new Subscription();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private permissionService: PermissionService,
    private featureActivationService: FeatureActivationService,
    private menuVisibilityService: MenuVisibilityService,
  ) {}

  ngOnInit() {
    // 首帧与 matchMedia 同步，避免仅依赖 observe 异步首包时 isMobile 仍为 false，
    // 在窄屏硬刷新会先渲染桌面 nz-sider、移动抽屉菜单触发异常（见 layout 说明）。
    if (typeof matchMedia !== 'undefined') {
      this.isMobile = matchMedia('(max-width: 768px)').matches;
      if (this.isMobile) {
        this.isMobileDrawerOpen = false;
      }
    }

    // 监听视口宽度变化，切换移动/桌面模式
    // 切换到移动端时同时关闭抽屉，避免残留打开状态
    this.subs.add(
      this.breakpointObserver.observe(['(max-width: 768px)']).subscribe(result => {
        this.isMobile = result.matches;
        if (this.isMobile) {
          this.isMobileDrawerOpen = false;
        }
      })
    );

    // 路由跳转成功后自动关闭移动端抽屉，无需用户手动点击关闭
    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => {
          if (this.isMobile) {
            this.isMobileDrawerOpen = false;
          }
          this.isMenuSettingsOpen = false;
          this.ensureCurrentRouteVisible();
        })
    );

    // 首次进入页面时，若命中默认重定向到已隐藏项，则立即校正到首个可见菜单。
    this.ensureCurrentRouteVisible();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  /**
   * Header 触发按钮的统一入口：
   * - 移动端：切换抽屉开/关
   * - 桌面端：切换侧边栏折叠/展开
   */
  toggleMenu() {
    if (this.isMobile) {
      this.isMobileDrawerOpen = !this.isMobileDrawerOpen;
    } else {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  toggleMenuSettings(): void {
    this.isMenuSettingsOpen = !this.isMenuSettingsOpen;
  }

  closeMenuSettings(): void {
    this.isMenuSettingsOpen = false;
  }

  onMenuVisibleChange(path: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.menuVisibilityService.setVisible(path, checked);
    this.ensureCurrentRouteVisible();
  }

  isMenuPathVisible(path: string): boolean {
    return this.menuVisibilityService.isVisible(path);
  }

  resetMenuVisibility(): void {
    this.menuVisibilityService.reset();
    this.ensureCurrentRouteVisible();
  }

  activateFeatures(): void {
    const code = this.activationCode.trim();
    if (code !== '999') {
      this.activationMessage = '激活码不正确';
      this.activationMessageType = 'error';
      return;
    }

    this.featureActivationService.activate(code);
    this.activationCode = '';
    this.activationMessage = '已解锁知识刷题、iOS学习、Angular学习';
    this.activationMessageType = 'success';
    this.ensureCurrentRouteVisible();
  }

  readonly menuItems: MenuItem[] = FEATURE_MENU_ITEMS;

  /**
   * 先做权限 + 激活过滤（用于设置面板，保证未解锁项不会出现在设置里）
   * 再叠加本地显示/隐藏设置（用于最终菜单展示）
   */
  private readonly availableMenuItems = computed(() => this.filterByPermissionAndActivation(this.menuItems));
  readonly visibleMenuItems = computed(() => this.filterByVisibility(this.availableMenuItems()));
  readonly menuSettingsGroups = computed<MenuSettingsGroup[]>(() =>
    this.availableMenuItems()
      .map((item) => ({
        label: item.label,
        children: (item.children ?? [])
          .filter((child): child is MenuItem & { path: string } => typeof child.path === 'string')
          .map((child) => ({ path: child.path, label: child.label })),
      }))
      .filter((group) => group.children.length > 0)
  );

  private filterByPermissionAndActivation(items: MenuItem[]): MenuItem[] {
    return items
      .map((item) => {
        const hasSelfPermission = this.permissionService.hasPermission(item.permission);
        const isActivated = this.featureActivationService.isActive(item.activationCode);
        const filteredChildren = item.children ? this.filterByPermissionAndActivation(item.children) : undefined;

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

    // 根路径、tools 根路径，或当前路径不在可见菜单里时，跳到第一个可见页面。
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
