import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'app.feature.activation.codes.v1';

/** 本地功能激活状态：输入正确激活码后持久化解锁对应功能。 */
@Injectable({ providedIn: 'root' })
export class FeatureActivationService {
  private readonly activeCodes = signal<Set<string>>(new Set(this.loadActiveCodes()));

  isActive(requiredCode?: string): boolean {
    if (!requiredCode) {
      return true;
    }
    return this.activeCodes().has(requiredCode);
  }

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

  private saveActiveCodes(codes: Set<string>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(codes)));
  }
}
