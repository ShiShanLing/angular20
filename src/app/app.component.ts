import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PermissionService } from './core/permission.service';

/** 根组件：仅挂载路由出口，具体页面由各路由组件渲染。 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: [':host { display: block; height: 100%; }']
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);
  private readonly permissionService = inject(PermissionService);

  constructor() {
    const rootEl = this.document.querySelector('app-root');
    const raw = rootEl?.getAttribute('data-permissions') ?? null;
    const permissions = this.parsePermissions(raw);
    if (permissions === null) {
      this.permissionService.clearPermissions();
    } else {
      this.permissionService.setPermissions(permissions);
    }
  }

  /**
   * 支持两种格式：
   * 1) JSON 数组：["tools.mortgage","practice.view"]
   * 2) 逗号分隔：tools.mortgage,practice.view
   */
  private parsePermissions(raw: string | null): string[] | null {
    if (raw == null) {
      return null;
    }
    const text = raw.trim();
    if (!text) {
      return [];
    }

    if (text.startsWith('[')) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed
            .map((value) => String(value).trim())
            .filter((value) => value.length > 0);
        }
      } catch {
        // JSON 格式非法时回退为逗号分隔解析
      }
    }

    return text
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
