
import { ChangeDetectionStrategy, Component, inject, DOCUMENT } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PermissionService } from './core/permission.service';
import { AuthService } from './core/auth.service';

/** 根组件：挂载路由出口，并在启动时注入权限列表。 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: [':host { display: block; height: 100%; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class AppComponent {
  private readonly document = inject(DOCUMENT);
  private readonly permissionService = inject(PermissionService);
  private readonly authService = inject(AuthService);
  
  // MARK: 构造注入
  // 依赖注入构造
  constructor() {
    // 优先使用登录返回的权限；否则尝试从 HTML data-permissions 注入（便于宿主页配置）
    const authPerms = this.authService.userPermissions();
    if (authPerms.length > 0) {
      this.permissionService.setPermissions(authPerms);
      return;
    }
    const rootEl = this.document.querySelector('app-root');
    const raw = rootEl?.getAttribute('data-permissions') ?? null;
    const permissions = this.parsePermissions(raw);
    if (permissions === null) {
      this.permissionService.clearPermissions();
    } else {
      this.permissionService.setPermissions(permissions);
      
    }
  }
  // MARK: 解析
  // 解析 data-permissions：支持 JSON 数组或逗号分隔字符串。
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
