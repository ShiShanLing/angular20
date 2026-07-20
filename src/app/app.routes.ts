import { Routes } from '@angular/router';
import { menuAccessGuard } from './core/menu-access.guard';
import { authGuard } from './core/auth.guard';

/** 顶层路由：登录页独立布局；其余页面走 layout 壳并需要登录认证。 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
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
        path: 'practice-list',
        loadComponent: () => import('./pages/practice/practice-list.component').then(m => m.PracticeListComponent),
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
        path: 'market',
        loadChildren: () => import('./pages/market/market.routes').then(m => m.MARKET_ROUTES)
      },
      {
        path: 'no-access',
        loadComponent: () => import('./pages/no-access/no-access.component').then(m => m.NoAccessComponent)
      },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
