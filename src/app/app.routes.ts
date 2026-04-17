import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
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
        loadComponent: () => import('./pages/practice/practice.component').then(m => m.PracticeComponent)
      },
      {
        path: 'chart-showcase',
        loadComponent: () =>
          import('./pages/chart-showcase/chart-showcase.component').then(m => m.ChartShowcaseComponent)
      },
    ]
  }
];
