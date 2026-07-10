import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { zh_CN, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { provideNzConfig } from 'ng-zorro-antd/core/config';
import {
  SearchOutline, CopyOutline, DeleteOutline, ArrowRightOutline, DownloadOutline,
  DashboardOutline, BarChartOutline, FormOutline, TableOutline, ExperimentOutline,
  RocketOutline, AppstoreOutline, ToolOutline, MenuOutline, MenuUnfoldOutline, MenuFoldOutline,
  CheckCircleFill, CloseCircleFill, ExclamationCircleFill, InfoCircleFill,
  MoneyCollectOutline, HeartOutline, ThunderboltOutline, CustomerServiceOutline,
  LeftOutline, RightOutline, CloudUploadOutline,
  LineChartOutline, PieChartOutline, RadarChartOutline,
  AreaChartOutline, HeatMapOutline,
  ApartmentOutline, DeploymentUnitOutline, NodeIndexOutline, GlobalOutline,
  EnvironmentOutline,
  BlockOutline,
  PictureOutline, CalendarOutline, BookOutline,
  QrcodeOutline, UploadOutline, VideoCameraOutline, StopOutline,
  UserOutline, LockOutline, LogoutOutline, KeyOutline,
} from '@ant-design/icons-angular/icons';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
const icons = [
  SearchOutline, CopyOutline, DeleteOutline, ArrowRightOutline, DownloadOutline,
  DashboardOutline, BarChartOutline, FormOutline, TableOutline, ExperimentOutline,
  RocketOutline, AppstoreOutline, ToolOutline, MenuOutline, MenuUnfoldOutline, MenuFoldOutline,
  CheckCircleFill, CloseCircleFill, ExclamationCircleFill, InfoCircleFill,
  MoneyCollectOutline, HeartOutline, ThunderboltOutline, CustomerServiceOutline,
  LeftOutline, RightOutline, CloudUploadOutline,
  LineChartOutline, PieChartOutline, RadarChartOutline,
  AreaChartOutline, HeatMapOutline,
  ApartmentOutline, DeploymentUnitOutline, NodeIndexOutline, GlobalOutline,
  EnvironmentOutline,
  BlockOutline,
  PictureOutline, CalendarOutline, BookOutline,
  QrcodeOutline, UploadOutline, VideoCameraOutline, StopOutline,
  UserOutline, LockOutline, LogoutOutline, KeyOutline,
];


import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';

registerLocaleData(zh);

/** 全局 Angular providers：Hash 路由、动画、HTTP、Ng-Zorro 中文与按需图标、ECharts 核心。 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withHashLocation()),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNzI18n(zh_CN),
    provideNzConfig({
      message: { nzTop: 80 }
    }),
    provideNzIcons(icons),
    provideEchartsCore({ echarts })
  ]
};
