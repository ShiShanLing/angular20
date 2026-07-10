import { Routes } from '@angular/router';
import { menuAccessGuard } from './core/menu-access.guard';

/** 顶层路由：`layout` 为壳；默认进入房贷工具；`tools` 懒加载子路由。 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivateChild: [menuAccessGuard],
    children: [
      { path: '', redirectTo: 'tools/mortgage', pathMatch: 'full' },
      {
        path: 'tools',
        loadChildren: () => import('./pages/tools/tools.routes').then(m => m.TOOLS_ROUTES)
      },
      {
        path: 'snake',
        loadComponent: () => import('./pages/snake/snake.component').then(m => m.SnakeComponent)
      },
      {
        path: 'tetris',
        loadComponent: () => import('./pages/tetris/tetris.component').then(m => m.TetrisComponent)
      },
      {
        path: 'practice',
        loadComponent: () => import('./pages/practice/practice.component').then(m => m.PracticeComponent),
        data: { practiceScope: 'practice' }
      },
      {
        path: 'ios-learning',
        loadComponent: () => import('./pages/practice/practice.component').then(m => m.PracticeComponent),
        data: { practiceScope: 'ios-learning' }
      },
      {
        path: 'angular-learning',
        loadComponent: () => import('./pages/practice/practice.component').then(m => m.PracticeComponent),
        data: { practiceScope: 'angular-learning' }
      },
      {
        path: 'chart-showcase',
        loadComponent: () =>
          import('./pages/chart-showcase/chart-showcase.component').then(m => m.ChartShowcaseComponent)
      },
      {
        path: 'html-preview',
        loadComponent: () =>
          import('./pages/html-preview/html-preview.component').then(m => m.HtmlPreviewComponent)
      },
      {
        path: 'no-access',
        loadComponent: () => import('./pages/no-access/no-access.component').then(m => m.NoAccessComponent)
      },
    ]
  }
];
