import {
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import {
  PRACTICE_CATEGORY_LABELS,
  PRACTICE_CATEGORY_LIST,
  type PracticeCategory,
  type PracticeFilterCategory,
  type PracticeItem,
} from './practice.types';
import { parsePracticeFile } from './practice-import';
import {
  PracticeStorageService,
  PRACTICE_SKIP_BUILTIN_SEED_KEY,
} from './practice-storage.service';
import { iosSeedToPracticeItems } from './ios-seed';
import { MarkdPipe } from './markd.pipe';
import { applyPracticeSearchFilter } from './practice-search.util';
import {
  compareUserAnswerToReference,
  type ComparePracticeResult,
} from './practice-compare.util';

type FilterValue = PracticeFilterCategory;

const FONT_SCALE_KEY = 'angular20_practice_font_scale_v1';
const FONT_MIN = 75;
const FONT_MAX = 135;
const FONT_DEFAULT = 100;

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [CommonModule, FormsModule, NzButtonModule, NzIconModule, NzModalModule, MarkdPipe],
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.scss',
})
export class PracticeComponent implements OnInit {
  private readonly storage = inject(PracticeStorageService);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  readonly categoryList = PRACTICE_CATEGORY_LIST;

  readonly items = signal<PracticeItem[]>([]);
  readonly filterCategory = signal<FilterValue>('all');
  readonly currentIndex = signal(0);
  readonly showAnswer = signal(false);
  readonly searchQuery = signal('');
  readonly userAnswer = signal('');
  readonly compareResult = signal<ComparePracticeResult | null>(null);
  readonly categoryMenuOpen = signal(false);
  readonly fontScale = signal(FONT_DEFAULT);

  readonly categoryFiltered = computed(() => {
    const all = this.items();
    const f = this.filterCategory();
    if (f === 'all') return all;
    return all.filter((i) => i.category === f);
  });

  readonly listForNav = computed(() =>
    applyPracticeSearchFilter(this.categoryFiltered(), this.searchQuery())
  );

  readonly currentItem = computed(() => {
    const list = this.listForNav();
    const idx = this.currentIndex();
    if (!list.length || idx < 0 || idx >= list.length) return null;
    return list[idx];
  });

  readonly statsTotal = computed(() => this.items().length);

  readonly statsByCategory = computed(() => this.storage.countByCategory(this.items()));

  readonly filterOptions: { value: FilterValue; label: string }[] = [
    { value: 'all', label: '全部题目' },
    ...PRACTICE_CATEGORY_LIST.map((c) => ({ value: c, label: PRACTICE_CATEGORY_LABELS[c] })),
  ];

  readonly navDisabled = computed(() => !this.listForNav().length);

  readonly canPrev = computed(() => this.currentIndex() > 0);

  readonly canNext = computed(() => {
    const n = this.listForNav().length;
    return n > 0 && this.currentIndex() < n - 1;
  });

  readonly categoryFabLabel = computed(() => {
    const f = this.filterCategory();
    return f === 'all' ? '类型' : PRACTICE_CATEGORY_LABELS[f];
  });

  categoryLabel(cat: PracticeCategory): string {
    return PRACTICE_CATEGORY_LABELS[cat];
  }

  ngOnInit(): void {
    this.fontScale.set(this.readFontScale());
    this.reloadFromStorage();
    const skipBuiltin =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(PRACTICE_SKIP_BUILTIN_SEED_KEY) === '1';
    if (!this.items().length && !skipBuiltin) {
      const seeded = iosSeedToPracticeItems(Date.now());
      this.storage.save(seeded);
      this.reloadFromStorage();
    }
    this.setFilter(this.storage.readSavedFilterCategory());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const t = ev.target as HTMLElement | null;
    if (t?.closest?.('.practice-fab-block')) return;
    this.categoryMenuOpen.set(false);
  }

  mergeBuiltinIosSeed(): void {
    const seeded = iosSeedToPracticeItems(Date.now());
    const { added, skipped } = this.storage.mergeItems(seeded);
    this.reloadFromStorage();
    this.clampIndex();
    this.resetQuestionUi();
    if (!added && !skipped) {
      this.msg.warning('内置题库为空。');
      return;
    }
    this.msg.success(`内置 iOS 题库：新增 ${added} 条，跳过已有 ${skipped} 条。`);
  }

  setFilter(value: FilterValue): void {
    this.filterCategory.set(value);
    this.storage.saveFilterCategory(value);
    this.categoryMenuOpen.set(false);
    this.clampIndex();
    this.resetQuestionUi();
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.clampIndex();
    this.resetQuestionUi();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.clampIndex();
    this.resetQuestionUi();
  }

  randomOne(): void {
    const list = this.listForNav();
    if (!list.length) {
      this.msg.warning('当前筛选下没有题目，请先导入或换一个分类。');
      return;
    }
    if (list.length < 2) return;
    let j = this.currentIndex();
    let guard = 0;
    while (j === this.currentIndex() && guard++ < 24) {
      j = Math.floor(Math.random() * list.length);
    }
    this.currentIndex.set(j);
    this.resetQuestionUi();
  }

  prev(): void {
    if (!this.canPrev()) return;
    this.currentIndex.update((i) => i - 1);
    this.resetQuestionUi();
  }

  next(): void {
    if (!this.canNext()) return;
    this.currentIndex.update((i) => i + 1);
    this.resetQuestionUi();
  }

  toggleCategoryMenu(ev: Event): void {
    ev.stopPropagation();
    this.categoryMenuOpen.update((v) => !v);
  }

  pickSearchResult(index: number): void {
    this.currentIndex.set(index);
    this.resetQuestionUi();
  }

  toggleAnswer(): void {
    this.showAnswer.update((v) => !v);
  }

  fontSmaller(ev: Event): void {
    ev.stopPropagation();
    const p = Math.max(FONT_MIN, Math.round((this.fontScale() - 5) / 5) * 5);
    this.applyFontScale(p);
  }

  fontLarger(ev: Event): void {
    ev.stopPropagation();
    const p = Math.min(FONT_MAX, Math.round((this.fontScale() + 5) / 5) * 5);
    this.applyFontScale(p);
  }

  onUserAnswerInput(value: string): void {
    this.userAnswer.set(value);
  }

  compareAnswers(): void {
    const item = this.currentItem();
    if (!item) return;
    const ref = item.answer ?? '';
    if (!this.userAnswer().trim() && !ref.trim()) {
      this.compareResult.set({
        message: '请先写下你的回答，或确认本题有参考答案。',
        level: 'low',
      });
      return;
    }
    this.compareResult.set(compareUserAnswerToReference(this.userAnswer(), ref));
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result;
      if (!(buf instanceof ArrayBuffer)) {
        this.msg.error('读取文件失败。');
        return;
      }
      const { drafts, errors } = parsePracticeFile(buf);
      if (!drafts.length && errors.length) {
        this.msg.error(errors.slice(0, 5).join('；') + (errors.length > 5 ? ' …' : ''));
        return;
      }
      if (!drafts.length) {
        this.msg.warning('没有找到可导入的题目。');
        return;
      }
      const { added, skipped } = this.storage.importDrafts(drafts);
      this.reloadFromStorage();
      this.clampIndex();
      this.resetQuestionUi();
      if (errors.length) {
        const preview = errors.slice(0, 2).join('；');
        this.msg.warning(
          `已导入 ${added} 条（跳过重复 ${skipped} 条）。部分行失败（${errors.length}）：${preview}${errors.length > 2 ? '…' : ''}`
        );
      } else {
        this.msg.success(`导入完成：新增 ${added} 条，跳过重复 ${skipped} 条。`);
      }
    };
    reader.onerror = () => this.msg.error('读取文件失败。');
    reader.readAsArrayBuffer(file);
  }

  confirmClear(): void {
    this.modal.confirm({
      nzTitle: '清空题库？',
      nzContent: '将删除本机浏览器中保存的全部题目，且不可恢复。',
      nzOkText: '清空',
      nzOkDanger: true,
      nzCancelText: '取消',
      nzOnOk: () => {
        this.storage.clearAll();
        this.reloadFromStorage();
        this.currentIndex.set(0);
        this.resetQuestionUi();
        this.msg.info('已清空题库。');
      },
    });
  }

  showImportHelp(): void {
    this.modal.info({
      nzTitle: '导入与内置题库',
      nzContent:
        '首次进入且本地无题时会自动写入 ios.seed.json。也可点「加载内置 iOS」合并。Excel 第一行为表头，至少含「题目」列；支持 .xlsx / .xls / .csv。题目存在本机 localStorage，重复题干会跳过。',
    });
  }

  private readFontScale(): number {
    try {
      const raw = sessionStorage.getItem(FONT_SCALE_KEY);
      if (!raw) return FONT_DEFAULT;
      const n = Number(raw);
      if (!Number.isFinite(n)) return FONT_DEFAULT;
      return Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(n / 5) * 5));
    } catch {
      return FONT_DEFAULT;
    }
  }

  private applyFontScale(p: number): void {
    this.fontScale.set(p);
    try {
      sessionStorage.setItem(FONT_SCALE_KEY, String(p));
    } catch {
      /* ignore */
    }
  }

  private reloadFromStorage(): void {
    this.items.set(this.storage.load());
    this.clampIndex();
  }

  private clampIndex(): void {
    const list = this.listForNav();
    if (!list.length) {
      this.currentIndex.set(0);
      return;
    }
    if (this.currentIndex() >= list.length) {
      this.currentIndex.set(list.length - 1);
    }
    if (this.currentIndex() < 0) {
      this.currentIndex.set(0);
    }
  }

  private resetQuestionUi(): void {
    this.showAnswer.set(false);
    this.userAnswer.set('');
    this.compareResult.set(null);
  }
}
