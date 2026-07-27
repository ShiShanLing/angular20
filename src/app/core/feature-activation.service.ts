import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'app.feature.activation.codes.v1';

/**
 * 本地功能激活服务。
 * 部分菜单（如知识刷题）需要输入激活码后才解锁；状态持久化到 localStorage。
 */
@Injectable({ providedIn: 'root' })
export class FeatureActivationService {
  private readonly activeCodes = signal<Set<string>>(new Set(this.loadActiveCodes()));

  // MARK: 是否激活
  // 判断功能是否已激活；未配置激活码时默认放行。
  isActive(requiredCode?: string): boolean {
    if (!requiredCode) {
      return true;
    }
    return this.activeCodes().has(requiredCode);
  }

  // MARK: 激活功能
  // 写入激活码并持久化；返回是否写入成功。
  activate(code: string): boolean {
    const normalized = code.trim();
    if (!normalized) {
      return false;
    }

    const next = new Set(this.activeCodes());
    next.add(normalized);
    this.activeCodes.set(next);
    this.saveActiveCodes(next);
    return true;
  }

  // MARK: 取消激活
  // 取消某个激活码。
  deactivate(code: string): boolean {
    const normalized = code.trim();
    if (!normalized || !this.activeCodes().has(normalized)) {
      return false;
    }

    const next = new Set(this.activeCodes());
    next.delete(normalized);
    this.activeCodes.set(next);
    this.saveActiveCodes(next);
    return true;
  }

  // MARK: 加载激活码
  private loadActiveCodes(): string[] {
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

  // MARK: 保存激活码
  private saveActiveCodes(codes: Set<string>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(codes)));
  }
}
