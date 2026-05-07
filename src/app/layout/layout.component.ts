import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
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

interface MenuItem {
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-layout',
  imports: [
    NgTemplateOutlet,   // 用于在模板中复用 ng-template（桌面 sider 与移动抽屉共享同一份菜单）
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

  // 统一管理所有订阅，在 ngOnDestroy 中一次性取消，防止内存泄漏
  private subs = new Subscription();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
  ) {}

  ngOnInit() {
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
        })
    );
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

  menuItems: MenuItem[] = [
    {
      label: '财务工具',
      icon: 'money-collect',
      children: [
        { path: '/tools/mortgage', label: '房贷计算' },
        { path: '/tools/salary', label: '个税计算' },
        { path: '/tools/accounting', label: '记账分期' },
        { path: '/tools/subscription', label: '订阅管理' },
        { path: '/tools/saving', label: '攒钱计划' },
        { path: '/tools/fire', label: 'FIRE 计算器' },
        { path: '/tools/anhui-pension', label: '安徽农村养老金' },
      ]
    },
    {
      label: '身体健康',
      icon: 'heart',
      children: [
        { path: '/tools/bmi', label: 'BMI/体脂' },
        { path: '/tools/water', label: '饮水提醒' },
        { path: '/tools/weight', label: '体重追踪' },
        { path: '/tools/sleep', label: '睡眠分析' },
      ]
    },
    {
      label: '效率工具',
      icon: 'thunderbolt',
      children: [
        { path: '/tools/time', label: '时间效率' },
        { path: '/tools/weather', label: '天气预报' },
        { path: '/tools/calendar', label: '万年历' },
        { path: '/tools/text', label: '文本处理' },
        { path: '/tools/dev', label: '开发助手' },
        { path: '/practice', label: '面试刷题' },
      ]
    },
    {
      label: '休闲游戏',
      icon: 'customer-service',
      children: [
        { path: '/snake', label: '贪吃蛇' },
        { path: '/tetris', label: '俄罗斯方块' },
      ]
    },
    {
      label: '数据演示',
      icon: 'bar-chart',
      children: [{ path: '/chart-showcase', label: '炫酷图表' }]
    }
  ];
}
