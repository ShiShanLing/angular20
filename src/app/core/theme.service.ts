import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'app.theme.mode.v1';

/**
 * 主题服务：管理深色/浅色模式切换，状态持久化到 localStorage。
 * 通过在 document.body 上添加 data-theme 属性来切换主题。
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.loadTheme());

  constructor() {
    // 初始化时立即应用主题
    this.applyTheme(this.mode());

    // 监听系统主题变化（如果用户未手动设置过）
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // 如果用户从未手动切换过，跟随系统
        if (!localStorage.getItem(STORAGE_KEY)) {
          const newMode: ThemeMode = e.matches ? 'dark' : 'light';
          this.mode.set(newMode);
        }
      });
    }
  }

  /** 切换主题 */
  toggle(): void {
    const newMode: ThemeMode = this.mode() === 'light' ? 'dark' : 'light';
    this.mode.set(newMode);
    this.saveTheme(newMode);
  }

  /** 设置指定主题 */
  setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    this.saveTheme(mode);
  }

  /** 是否为深色模式 */
  isDark(): boolean {
    return this.mode() === 'dark';
  }

  private applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    document.body.setAttribute('data-theme', mode);
    // ng-zorro-antd 深色模式类名
    if (mode === 'dark') {
      document.body.classList.add('nz-theme-dark');
    } else {
      document.body.classList.remove('nz-theme-dark');
    }
  }

  private saveTheme(mode: ThemeMode): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, mode);
    this.applyTheme(mode);
  }

  private loadTheme(): ThemeMode {
    if (typeof localStorage === 'undefined') {
      return this.getSystemTheme();
    }
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // 首次访问，跟随系统
    return this.getSystemTheme();
  }

  private getSystemTheme(): ThemeMode {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
}
