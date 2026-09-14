import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'app.theme.mode.v1';

/**
 * 主题服务：管理深色/浅色模式切换，状态持久化到 localStorage。
 * 通过在 document.documentElement / body 上添加 data-theme，并同步 color-scheme，
 * 避免安卓 WebView 在系统暗色下把浅色页再强制压暗。
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.loadTheme());
  private userPicked = this.hasSavedTheme();

  // MARK: 构造注入
  // 用 effect 同步 mode → DOM；监听系统主题变化
  constructor() {
    effect(() => {
      this.applyTheme(this.mode());
    });

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = (matches: boolean) => {
        if (this.userPicked || this.hasSavedTheme()) return;
        this.mode.set(matches ? 'dark' : 'light');
      };
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', (e) => onChange(e.matches));
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener((e) => onChange(e.matches));
      }
    }
  }

  // MARK: 切换
  // 切换主题并持久化
  toggle(): void {
    this.setTheme(this.mode() === 'light' ? 'dark' : 'light');
  }

  // MARK: 设置主题
  // 设置指定主题并持久化
  setTheme(mode: ThemeMode): void {
    this.userPicked = true;
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
    document.documentElement.setAttribute('data-theme', mode);
    document.body.setAttribute('data-theme', mode);
    document.documentElement.classList.toggle('nz-theme-dark', mode === 'dark');
    document.body.classList.toggle('nz-theme-dark', mode === 'dark');
    // 告诉 Chrome / 安卓 WebView：当前页已自行处理主题，不要再做算法压暗
    document.documentElement.style.colorScheme = mode;
    document.body.style.colorScheme = mode;
  }

  // MARK: 保存
  private saveTheme(mode: ThemeMode): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // 部分 WebView 禁用或配额异常时仍保留本次会话中的选择
    }
  }

  // MARK: 加载主题
  private loadTheme(): ThemeMode {
    const saved = this.readSavedTheme();
    if (saved) return saved;
    return this.getSystemTheme();
  }

  private hasSavedTheme(): boolean {
    return this.readSavedTheme() !== null;
  }

  private readSavedTheme(): ThemeMode | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'light' || saved === 'dark' ? saved : null;
    } catch {
      return null;
    }
  }

  // MARK: 获取
  private getSystemTheme(): ThemeMode {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
}
