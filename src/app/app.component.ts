import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** 根组件：仅挂载路由出口，具体页面由各路由组件渲染。 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: [':host { display: block; height: 100%; }']
})
export class AppComponent {}
