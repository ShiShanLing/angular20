import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'app.theme.mode.v1';

/**
 * 主题服务：管理深色/浅色模式切换，状态持久化到 localStorage。
 * 通过在 document.body 上添加 data-theme 属性来切换主题。
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.loadTheme());

  // MARK: 构造注入
  // 用 effect 同步 mode → DOM；监听系统主题变化
  constructor() {
    effect(() => {
      this.applyTheme(this.mode());
    });

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          this.mode.set(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  // MARK: 切换
  // 切换主题并持久化
  toggle(): void {
    const newMode: ThemeMode = this.mode() === 'light' ? 'dark' : 'light';
    this.mode.set(newMode);
    this.saveTheme(newMode);
  }

  // MARK: 设置主题
  // 设置指定主题并持久化
  setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    this.saveTheme(mode);
  }

  // MARK: 是否暗色
  // 是否为深色模式
  isDark(): boolean {
    return this.mode() === 'dark';
  }

  // MARK: 应用主题
  private applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    document.body.setAttribute('data-theme', mode);
    if (mode === 'dark') {
      document.body.classList.add('nz-theme-dark');
    } else {
      document.body.classList.remove('nz-theme-dark');
    }
  }

  // MARK: 保存
  private saveTheme(mode: ThemeMode): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, mode);
  }

  // MARK: 加载主题
  private loadTheme(): ThemeMode {
    if (typeof localStorage === 'undefined') {
      return this.getSystemTheme();
    }
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return this.getSystemTheme();
  }

  // MARK: 获取
  private getSystemTheme(): ThemeMode {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
}
