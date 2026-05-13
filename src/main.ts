import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/** 浏览器入口：挂载根组件与 `appConfig`。 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
