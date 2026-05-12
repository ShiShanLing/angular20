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
  type PracticeDailyState,
  type PracticeDayRecord,
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
const DAILY_TARGET = 5;

interface PracticeCalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  total: number;
  remembered: number;
  done: boolean;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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
  readonly todayKey = signal(formatLocalDate(new Date()));
  readonly dailyState = signal<PracticeDailyState>({ records: {} });
  readonly calendarMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  readonly categoryFiltered = computed(() => {
    const all = this.items();
    const f = this.filterCategory();
    if (f === 'all') return all;
    return all.filter((i) => i.category === f);
  });

  readonly searchResults = computed(() =>
    applyPracticeSearchFilter(this.categoryFiltered(), this.searchQuery())
  );

  readonly todayRecord = computed(() => this.dailyState().records[this.todayKey()] ?? null);

  readonly dailyItems = computed(() => {
    const record = this.todayRecord();
    if (!record) return [];
    const byId = new Map(this.items().map((item) => [item.id, item]));
    return record.itemIds.map((id) => byId.get(id)).filter((item): item is PracticeItem => !!item);
  });

  readonly rememberedTodayIds = computed(() => new Set(this.todayRecord()?.rememberedIds ?? []));

  readonly pendingDailyItems = computed(() => {
    const remembered = this.rememberedTodayIds();
    return this.dailyItems().filter((item) => !remembered.has(item.id));
  });

  readonly listForNav = computed(() => {
    if (this.searchQuery().trim()) return this.searchResults();
    if (this.todayRecord() && this.dailyItems().length) return this.pendingDailyItems();
    return this.categoryFiltered();
  });

  readonly currentItem = computed(() => {
    const list = this.listForNav();
    const idx = this.currentIndex();
    if (!list.length || idx < 0 || idx >= list.length) return null;
    return list[idx];
  });

  readonly statsTotal = computed(() => this.items().length);

  readonly statsByCategory = computed(() => this.storage.countByCategory(this.items()));

  readonly dailyRememberedCount = computed(() => this.dailyItems().length - this.pendingDailyItems().length);

  readonly dailyTotal = computed(() => this.dailyItems().length);

  readonly dailyCompleted = computed(() => this.dailyTotal() > 0 && !this.pendingDailyItems().length);

  readonly currentItemInDaily = computed(() => {
    const item = this.currentItem();
    return !!item && this.dailyItems().some((daily) => daily.id === item.id);
  });

  readonly calendarTitle = computed(() => {
    const d = this.calendarMonth();
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
  });

  readonly calendarDays = computed<PracticeCalendarDay[]>(() => {
    const month = this.calendarMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const first = new Date(year, monthIndex, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    const days: PracticeCalendarDay[] = [];
    const records = this.dailyState().records;
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const date = formatLocalDate(d);
      const record = records[date];
      const total = record?.itemIds.length ?? 0;
      const remembered = record?.rememberedIds.length ?? 0;
      days.push({
        date,
        day: d.getDate(),
        inMonth: d.getMonth() === monthIndex,
        total,
        remembered,
        done: total > 0 && remembered >= total,
      });
    }
    return days;
  });

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
    this.dailyState.set(this.storage.readDailyState());
    this.ensureTodayPractice();
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
    this.ensureTodayPractice();
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

  markRemembered(): void {
    const item = this.currentItem();
    if (!item || !this.dailyItems().some((daily) => daily.id === item.id)) return;
    this.updateTodayRecord((record) => {
      const remembered = new Set(record.rememberedIds);
      remembered.add(item.id);
      const next: PracticeDayRecord = {
        ...record,
        rememberedIds: [...remembered],
        attempts: record.attempts + 1,
      };
      if (next.rememberedIds.length >= next.itemIds.length && !next.completedAt) {
        next.completedAt = Date.now();
      }
      return next;
    });
    this.advanceAfterDailyAction();
    if (this.dailyCompleted()) {
      this.msg.success('今天 5 题已全部记住了。');
    }
  }

  markForgotten(): void {
    const item = this.currentItem();
    if (!item || !this.dailyItems().some((daily) => daily.id === item.id)) return;
    this.updateTodayRecord((record) => ({ ...record, attempts: record.attempts + 1 }));
    const list = this.listForNav();
    this.currentIndex.set(list.length > 1 ? (this.currentIndex() + 1) % list.length : 0);
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
      this.ensureTodayPractice();
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
        this.dailyState.set(this.storage.readDailyState());
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

  prevCalendarMonth(): void {
    const d = this.calendarMonth();
    this.calendarMonth.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextCalendarMonth(): void {
    const d = this.calendarMonth();
    this.calendarMonth.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
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

  private ensureTodayPractice(): void {
    const items = this.items();
    if (!items.length) return;
    const state = this.storage.readDailyState();
    const date = this.todayKey();
    const existing = state.records[date];
    const validIds = new Set(items.map((item) => item.id));
    const keptIds = existing?.itemIds.filter((id) => validIds.has(id)) ?? [];
    const rememberedIds = existing?.rememberedIds.filter((id) => keptIds.includes(id)) ?? [];
    const needed = Math.min(DAILY_TARGET, items.length) - keptIds.length;
    const candidates = items.filter((item) => !keptIds.includes(item.id));
    const picked = this.pickDailyItems(candidates, date, needed).map((item) => item.id);
    state.records[date] = {
      date,
      itemIds: [...keptIds, ...picked],
      rememberedIds,
      attempts: existing?.attempts ?? 0,
      completedAt: existing?.completedAt,
    };
    if (state.records[date].rememberedIds.length < state.records[date].itemIds.length) {
      delete state.records[date].completedAt;
    }
    this.dailyState.set(state);
    this.storage.saveDailyState(state);
    this.clampIndex();
  }

  private pickDailyItems(items: PracticeItem[], date: string, count: number): PracticeItem[] {
    if (count <= 0) return [];
    return [...items]
      .sort((a, b) => hashString(`${date}:${a.id}`) - hashString(`${date}:${b.id}`))
      .slice(0, count);
  }

  private updateTodayRecord(updater: (record: PracticeDayRecord) => PracticeDayRecord): void {
    const record = this.todayRecord();
    if (!record) return;
    const state = { records: { ...this.dailyState().records } };
    state.records[this.todayKey()] = updater(record);
    this.dailyState.set(state);
    this.storage.saveDailyState(state);
  }

  private advanceAfterDailyAction(): void {
    const list = this.listForNav();
    if (!list.length) {
      this.currentIndex.set(0);
    } else if (this.currentIndex() >= list.length) {
      this.currentIndex.set(0);
    } else if (list.length > 1) {
      this.currentIndex.set(this.currentIndex() % list.length);
    }
    this.resetQuestionUi();
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
