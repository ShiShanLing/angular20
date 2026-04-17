import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

interface MenuItem {
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-layout',
  imports: [
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
export class LayoutComponent {
  isCollapsed = false;

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
