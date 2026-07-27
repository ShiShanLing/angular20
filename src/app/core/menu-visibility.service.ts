import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'app.menu.hidden.paths.v1';

/**
 * 菜单本地显隐服务。
 * 以 path 为键记录“隐藏项”；未记录则视为显示。状态持久化到 localStorage。
 */
@Injectable({ providedIn: 'root' })
export class MenuVisibilityService {
  private readonly hiddenPaths = signal<Set<string>>(new Set(this.loadHiddenPaths()));

  // MARK: 是否可见
  // 菜单项是否应显示。
  isVisible(path?: string): boolean {
    if (!path) {
      return true;
    }
    return !this.hiddenPaths().has(path);
  }

  // MARK: 设置显隐
  // 设置某路径的显示/隐藏，并持久化。
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

  // MARK: 重置
  // 清空所有隐藏项，恢复默认全显示。
  reset(): void {
    const next = new Set<string>();
    this.hiddenPaths.set(next);
    this.saveHiddenPaths(next);
  }

  // MARK: 加载隐藏项
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

  // MARK: 保存隐藏项
  private saveHiddenPaths(hidden: Set<string>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(hidden)));
  }
}
