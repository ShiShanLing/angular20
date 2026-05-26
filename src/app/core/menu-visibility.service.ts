import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'app.menu.hidden.paths.v1';

/**
 * 菜单显示设置（本地持久化）：
 * - 以 path 作为唯一键
 * - 记录“隐藏项”集合，未记录则视为显示
 */
@Injectable({ providedIn: 'root' })
export class MenuVisibilityService {
  private readonly hiddenPaths = signal<Set<string>>(new Set(this.loadHiddenPaths()));

  isVisible(path?: string): boolean {
    if (!path) {
      return true;
    }
    return !this.hiddenPaths().has(path);
  }

  setVisible(path: string, visible: boolean): void {
    const next = new Set(this.hiddenPaths());
    if (visible) {
      next.delete(path);
    } else {
      next.add(path);
    }
    this.hiddenPaths.set(next);
    this.saveHiddenPaths(next);
  }

  reset(): void {
    const next = new Set<string>();
    this.hiddenPaths.set(next);
    this.saveHiddenPaths(next);
  }

  private loadHiddenPaths(): string[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
    } catch {
      return [];
    }
  }

  private saveHiddenPaths(hidden: Set<string>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(hidden)));
  }
}
