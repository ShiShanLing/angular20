import { Injectable, signal } from '@angular/core';

/**
 * 全局权限服务：
 * - 默认未配置权限时放行（避免本地未注入权限字段导致菜单全空）
 * - 一旦设置权限列表，则按白名单判定
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly configured = signal(false);
  private readonly permissions = signal<Set<string>>(new Set());

  /** 注入一组权限编码（白名单）。 */
  setPermissions(codes: string[]): void {
    const normalized = codes
      .map((code) => code.trim())
      .filter((code) => code.length > 0);
    this.permissions.set(new Set(normalized));
    this.configured.set(true);
  }

  /** 清空权限配置：退回到“未配置即放行”的默认态。 */
  clearPermissions(): void {
    this.permissions.set(new Set());
    this.configured.set(false);
  }

  /** 判断当前用户是否有某个权限。 */
  hasPermission(code?: string): boolean {
    if (!code) {
      return true;
    }
    if (!this.configured()) {
      return true;
    }
    return this.permissions().has(code);
  }
}
