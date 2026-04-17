import { Routes } from '@angular/router';

export const TOOLS_ROUTES: Routes = [
  { path: '', redirectTo: 'mortgage', pathMatch: 'full' },
  {
    path: 'mortgage',
    loadComponent: () => import('./tools-mortgage.component').then(m => m.ToolsMortgageComponent)
  },
  {
    path: 'bmi',
    loadComponent: () => import('./tools-bmi.component').then(m => m.ToolsBmiComponent)
  },
  {
    path: 'water',
    loadComponent: () => import('./tools-water.component').then(m => m.ToolsWaterComponent)
  },
  {
    path: 'time',
    loadComponent: () => import('./tools-time.component').then(m => m.ToolsTimeComponent)
  },
  {
    path: 'accounting',
    loadComponent: () => import('./tools-accounting.component').then(m => m.ToolsAccountingComponent)
  },
  {
    path: 'subscription',
    loadComponent: () => import('./tools-subscription.component').then(m => m.ToolsSubscriptionComponent)
  },
  {
    path: 'salary',
    loadComponent: () => import('./tools-salary.component').then(m => m.ToolsSalaryComponent)
  },
  {
    path: 'saving',
    loadComponent: () => import('./tools-saving.component').then(m => m.ToolsSavingComponent)
  },
  {
    path: 'fire',
    loadComponent: () => import('./tools-fire.component').then(m => m.ToolsFireComponent)
  },
  {
    path: 'anhui-pension',
    loadComponent: () =>
      import('./tools-anhui-pension.component').then(m => m.ToolsAnhuiPensionComponent)
  },
  {
    path: 'weight',
    loadComponent: () => import('./tools-weight.component').then(m => m.ToolsWeightComponent)
  },
  {
    path: 'sleep',
    loadComponent: () => import('./tools-sleep.component').then(m => m.ToolsSleepComponent)
  },
  {
    path: 'text',
    loadComponent: () => import('./tools-text.component').then(m => m.ToolsTextComponent)
  },
  {
    path: 'dev',
    loadComponent: () => import('./tools-dev.component').then(m => m.ToolsDevComponent)
  },
  {
    path: 'weather',
    loadComponent: () => import('./tools-weather.component').then(m => m.ToolsWeatherComponent)
  },
  {
    path: 'calendar',
    loadComponent: () => import('./tools-calendar.component').then(m => m.ToolsCalendarComponent)
  },
  // 兼容旧链接：之前的“健康与时间”页面
  { path: 'health', redirectTo: 'bmi', pathMatch: 'full' }
];
