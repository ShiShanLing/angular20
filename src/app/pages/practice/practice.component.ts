import {
  Component,
  HostListener,
  OnDestroy,
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
  stripMarkdownForSearch,
} from './practice-compare.util';

type FilterValue = PracticeFilterCategory;
type ChantPhase = 'idle' | 'question' | 'answer';

const FONT_SCALE_KEY = 'angular20_practice_font_scale_v1';
const SPEECH_RATE_KEY = 'angular20_practice_speech_rate_v1';
const FONT_MIN = 75;
const FONT_MAX = 135;
const FONT_DEFAULT = 100;
const SPEECH_RATE_MIN = 0.7;
const SPEECH_RATE_MAX = 1.1;
const SPEECH_RATE_DEFAULT = 0.8;
const DAILY_TARGET = 5;

interface PracticeCalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  total: number;
  remembered: number;
  done: boolean;
}

/** 将 Date 格式化为本地日期键，供每日刷题记录索引使用。 */
function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 简单稳定哈希，用于按日期从题库里确定性抽取每日题目。 */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 面试刷题页：本地题库、分类与搜索、每日练习、语音播报与答案自检。
 * 状态以 signal/computed 为主；持久化委托 {@link PracticeStorageService}。
 */
@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [CommonModule, FormsModule, NzButtonModule, NzIconModule, NzModalModule, MarkdPipe],
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.scss',
})
export class PracticeComponent implements OnInit, OnDestroy {
  private readonly storage = inject(PracticeStorageService);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  /** 唱题模式中题目与答案之间、答案与下一题之间的短暂停顿。 */
  private chantTimer: ReturnType<typeof setTimeout> | null = null;
  /** 每次播放递增，防止已取消的语音回调继续推进唱题流程。 */
  private speechRunId = 0;

  readonly categoryList = PRACTICE_CATEGORY_LIST;

  // 页面核心状态：题库、筛选、当前题、答案显隐、搜索与自检结果。
  readonly items = signal<PracticeItem[]>([]);
  readonly filterCategory = signal<FilterValue>('all');
  readonly currentIndex = signal(0);
  readonly showAnswer = signal(false);
  readonly searchQuery = signal('');
  readonly userAnswer = signal('');
  readonly compareResult = signal<ComparePracticeResult | null>(null);
  readonly categoryMenuOpen = signal(false);

  // 视觉与每日练习状态：字号、日期记录、日历月份。
  readonly fontScale = signal(FONT_DEFAULT);
  readonly speechRate = signal(SPEECH_RATE_DEFAULT);
  readonly todayKey = signal(formatLocalDate(new Date()));
  readonly dailyState = signal<PracticeDailyState>({ records: {} });
  readonly calendarMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  // 语音播报状态：单次播放、唱题模式开关与唱题游标。
  readonly isSpeaking = signal(false);
  readonly chantMode = signal(false);
  readonly chantIndex = signal(0);
  readonly chantPhase = signal<ChantPhase>('idle');

  /** 当前分类筛选后的题目列表。 */
  readonly categoryFiltered = computed(() => {
    const all = this.items();
    const f = this.filterCategory();
    if (f === 'all') return all;
    return all.filter((i) => i.category === f);
  });

  /** 在当前分类内应用关键词搜索后的结果。 */
  readonly searchResults = computed(() =>
    applyPracticeSearchFilter(this.categoryFiltered(), this.searchQuery())
  );

  /** 语音播放使用的列表；唱题模式不使用每日待复习列表，避免影响学习统计。 */
  readonly listenList = computed(() => {
    if (this.searchQuery().trim()) return this.searchResults();
    return this.categoryFiltered();
  });

  /** 今天的练习记录；不存在时返回 null。 */
  readonly todayRecord = computed(() => this.dailyState().records[this.todayKey()] ?? null);

  /** 今天抽到的题目实体，自动过滤已经从题库删除的 id。 */
  readonly dailyItems = computed(() => {
    const record = this.todayRecord();
    if (!record) return [];
    const byId = new Map(this.items().map((item) => [item.id, item]));
    return record.itemIds.map((id) => byId.get(id)).filter((item): item is PracticeItem => !!item);
  });

  /** 今天已经标记“记住了”的题目 id 集合。 */
  readonly rememberedTodayIds = computed(() => new Set(this.todayRecord()?.rememberedIds ?? []));

  /** 今天仍需循环练习的题目。 */
  readonly pendingDailyItems = computed(() => {
    const remembered = this.rememberedTodayIds();
    return this.dailyItems().filter((item) => !remembered.has(item.id));
  });

  /** 页面上一题/下一题实际导航的列表：搜索优先，其次每日待练，最后分类全量。 */
  readonly listForNav = computed(() => {
    if (this.searchQuery().trim()) return this.searchResults();
    if (this.todayRecord() && this.dailyItems().length) return this.pendingDailyItems();
    return this.categoryFiltered();
  });

  /** 当前正在展示的题目。 */
  readonly currentItem = computed(() => {
    const list = this.listForNav();
    const idx = this.currentIndex();
    if (!list.length || idx < 0 || idx >= list.length) return null;
    return list[idx];
  });

  /** 唱题模式当前正在播放的题目。 */
  readonly chantItem = computed(() => {
    const list = this.listenList();
    const idx = this.chantIndex();
    if (!list.length || idx < 0 || idx >= list.length) return null;
    return list[idx];
  });

  /** 全库题目数量。 */
  readonly statsTotal = computed(() => this.items().length);

  /** 各分类题目数量统计。 */
  readonly statsByCategory = computed(() => this.storage.countByCategory(this.items()));

  /** 今日已经记住的题目数量。 */
  readonly dailyRememberedCount = computed(() => this.dailyItems().length - this.pendingDailyItems().length);

  /** 今日练习总题数。 */
  readonly dailyTotal = computed(() => this.dailyItems().length);

  /** 今日题目是否全部标记为已记住。 */
  readonly dailyCompleted = computed(() => this.dailyTotal() > 0 && !this.pendingDailyItems().length);

  /** 当前题是否属于今天的练习池，用于控制“记住了/还没记住”按钮。 */
  readonly currentItemInDaily = computed(() => {
    const item = this.currentItem();
    return !!item && this.dailyItems().some((daily) => daily.id === item.id);
  });

  /** 日历面板标题。 */
  readonly calendarTitle = computed(() => {
    const d = this.calendarMonth();
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
  });

  /** 当前日历月份展示的 6 周日期格。 */
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

  /** 分类浮层的选项。 */
  readonly filterOptions: { value: FilterValue; label: string }[] = [
    { value: 'all', label: '全部题目' },
    ...PRACTICE_CATEGORY_LIST.map((c) => ({ value: c, label: PRACTICE_CATEGORY_LABELS[c] })),
  ];

  /** 导航按钮是否禁用。 */
  readonly navDisabled = computed(() => !this.listForNav().length);

  /** 是否可以前往上一题。 */
  readonly canPrev = computed(() => this.currentIndex() > 0);

  /** 是否可以前往下一题。 */
  readonly canNext = computed(() => {
    const n = this.listForNav().length;
    return n > 0 && this.currentIndex() < n - 1;
  });

  /** 当前浏览器是否支持 Web Speech 语音播报。 */
  readonly speechAvailable = computed(() => this.canUseSpeech());

  /** 唱题视图是否展示答案；题目播完进入答案阶段才展开。 */
  readonly chantAnswerVisible = computed(() => this.chantPhase() === 'answer');

  /** 右侧分类悬浮按钮展示的短标签。 */
  readonly categoryFabLabel = computed(() => {
    const f = this.filterCategory();
    return f === 'all' ? '类型' : PRACTICE_CATEGORY_LABELS[f];
  });

  /** 将分类枚举转成界面展示文案。 */
  categoryLabel(cat: PracticeCategory): string {
    return PRACTICE_CATEGORY_LABELS[cat];
  }

  /** 初始化本地题库、内置题库、每日记录与上次保存的分类筛选。 */
  ngOnInit(): void {
    this.fontScale.set(this.readFontScale());
    this.speechRate.set(this.readSpeechRate());
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

  /** 组件销毁时停止浏览器语音，避免离开页面后仍继续播放。 */
  ngOnDestroy(): void {
    this.stopSpeech();
  }

  @HostListener('document:click', ['$event'])
  /** 点击浮层之外时关闭分类菜单。 */
  onDocumentClick(ev: MouseEvent): void {
    const t = ev.target as HTMLElement | null;
    if (t?.closest?.('.practice-fab-block')) return;
    this.categoryMenuOpen.set(false);
  }

  /** 合并内置 iOS 题库到本地题库，重复题目会跳过。 */
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

  /** 切换分类筛选，并重置当前题的答案、自检和播放状态。 */
  setFilter(value: FilterValue): void {
    this.filterCategory.set(value);
    this.storage.saveFilterCategory(value);
    this.categoryMenuOpen.set(false);
    this.clampIndex();
    this.resetQuestionUi();
  }

  /** 更新搜索关键词，并让当前题索引保持在合法范围。 */
  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.clampIndex();
    this.resetQuestionUi();
  }

  /** 清空搜索条件并恢复当前导航列表。 */
  clearSearch(): void {
    this.searchQuery.set('');
    this.clampIndex();
    this.resetQuestionUi();
  }

  /** 在当前导航列表中随机切到另一题。 */
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

  /** 播放当前题目的分类、标签和题干。 */
  speakQuestion(): void {
    const item = this.currentItem();
    if (!item) return;
    this.stopChantOnly();
    this.speakText(this.questionSpeechText(item));
  }

  /** 播放当前题目的口播一句和参考答案。 */
  speakAnswer(): void {
    const item = this.currentItem();
    if (!item) return;
    this.stopChantOnly();
    this.speakText(this.answerSpeechText(item));
  }

  /** 开关唱题模式；开启后自动按题目、答案、下一题循环播放。 */
  toggleChantMode(): void {
    if (this.chantMode()) {
      this.stopSpeech();
      return;
    }
    this.startChantMode();
  }

  /** 从当前题或当前筛选列表第一题开始唱题，不写入每日学习统计。 */
  startChantMode(): void {
    const list = this.listenList();
    if (!list.length) {
      this.msg.warning('当前筛选下没有可播放的题目。');
      return;
    }
    if (!this.canUseSpeech()) {
      this.msg.warning('当前浏览器不支持语音播报。');
      return;
    }
    const current = this.currentItem();
    const currentInListenList = current ? list.findIndex((item) => item.id === current.id) : -1;
    this.chantIndex.set(currentInListenList >= 0 ? currentInListenList : 0);
    this.chantMode.set(true);
    this.playChantQuestion();
  }

  /** 将当前每日题目标记为已记住，并在今日题目完成时记录完成时间。 */
  markRemembered(): void {
    const item = this.currentItem();
    if (!item || !this.currentItemInDaily()) return;
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
      const n = this.dailyTotal();
      this.msg.success(`今天 ${n} 题已全部记住了。`);
    }
  }

  /** 将当前每日题目标记为还没记住，只增加尝试次数并进入下一道待练题。 */
  markForgotten(): void {
    const item = this.currentItem();
    if (!item || !this.currentItemInDaily()) return;
    this.updateTodayRecord((record) => ({ ...record, attempts: record.attempts + 1 }));
    const list = this.listForNav();
    this.currentIndex.set(list.length > 1 ? (this.currentIndex() + 1) % list.length : 0);
    this.resetQuestionUi();
  }

  /** 切换到上一题。 */
  prev(): void {
    if (!this.canPrev()) return;
    this.currentIndex.update((i) => i - 1);
    this.resetQuestionUi();
  }

  /** 切换到下一题。 */
  next(): void {
    if (!this.canNext()) return;
    this.currentIndex.update((i) => i + 1);
    this.resetQuestionUi();
  }

  /** 打开或关闭右侧分类筛选菜单。 */
  toggleCategoryMenu(ev: Event): void {
    ev.stopPropagation();
    this.categoryMenuOpen.update((v) => !v);
  }

  /** 从搜索结果下拉中跳转到指定题目。 */
  pickSearchResult(index: number): void {
    this.currentIndex.set(index);
    this.resetQuestionUi();
  }

  /** 显示或隐藏参考答案。 */
  toggleAnswer(): void {
    this.showAnswer.update((v) => !v);
  }

  /** 缩小刷题区域字号。 */
  fontSmaller(ev: Event): void {
    ev.stopPropagation();
    const p = Math.max(FONT_MIN, Math.round((this.fontScale() - 5) / 5) * 5);
    this.applyFontScale(p);
  }

  /** 放大刷题区域字号。 */
  fontLarger(ev: Event): void {
    ev.stopPropagation();
    const p = Math.min(FONT_MAX, Math.round((this.fontScale() + 5) / 5) * 5);
    this.applyFontScale(p);
  }

  /** 降低语音播报速度，新速度会在下一段朗读开始时生效。 */
  speechSlower(): void {
    this.applySpeechRate(this.speechRate() - 0.1);
  }

  /** 提高语音播报速度，新速度会在下一段朗读开始时生效。 */
  speechFaster(): void {
    this.applySpeechRate(this.speechRate() + 0.1);
  }

  /** 同步用户手写答案。 */
  onUserAnswerInput(value: string): void {
    this.userAnswer.set(value);
  }

  /** 将用户答案与参考答案做轻量相似度对比。 */
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

  /** 处理 Excel/CSV 文件选择、解析、导入与错误提示。 */
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

  /** 二次确认后清空本地题库和学习记录。 */
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

  /** 展示导入格式、本地存储和内置题库说明。 */
  showImportHelp(): void {
    this.modal.info({
      nzTitle: '导入与内置题库',
      nzContent:
        '首次进入且本地无题时会自动写入 ios.seed.json。也可点「加载内置 iOS」合并。Excel 第一行为表头，至少含「题目」列；支持 .xlsx / .xls / .csv。题目存在本机 localStorage，重复题干会跳过。',
    });
  }

  /** 日历切到上一个月。 */
  prevCalendarMonth(): void {
    const d = this.calendarMonth();
    this.calendarMonth.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  

  /** 日历切到下一个月。 */
  nextCalendarMonth(): void {
    const d = this.calendarMonth();
    this.calendarMonth.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
  
  /** 停止所有语音播放，并退出唱题模式。 */
  stopSpeech(): void {
    this.speechRunId++;
    this.clearChantTimer();
    this.chantMode.set(false);
    this.chantPhase.set('idle');
    this.isSpeaking.set(false);
    if (this.canUseSpeech()) {
      window.speechSynthesis.cancel();
    }
  }

  /** 唱题模式播放当前题目，结束后自动播放答案。 */
  private playChantQuestion(): void {
    if (!this.chantMode()) return;
    const item = this.chantItem();
    if (!item) {
      this.stopSpeech();
      return;
    }
    this.chantPhase.set('question');
    this.syncPracticeIndexToChantItem(item);
    this.speakText(this.questionSpeechText(item), () => {
      if (!this.chantMode()) return;
      this.chantTimer = setTimeout(() => this.playChantAnswer(), 500);
    });
  }

  /** 唱题模式播放当前答案，结束后自动推进下一题。 */
  private playChantAnswer(): void {
    if (!this.chantMode()) return;
    const item = this.chantItem();
    if (!item) {
      this.stopSpeech();
      return;
    }
    this.chantPhase.set('answer');
    this.speakText(this.answerSpeechText(item), () => {
      if (!this.chantMode()) return;
      this.chantTimer = setTimeout(() => this.advanceChant(), 900);
    });
  }

  /** 唱题游标前进一位，到末尾后循环回第一题。 */
  private advanceChant(): void {
    const list = this.listenList();
    if (!this.chantMode() || !list.length) {
      this.stopSpeech();
      return;
    }
    this.chantIndex.set((this.chantIndex() + 1) % list.length);
    this.playChantQuestion();
  }

  /** 唱题切题时同步普通刷题游标，退出唱题后停在刚听到的题目附近。 */
  private syncPracticeIndexToChantItem(item: PracticeItem): void {
    const idx = this.listForNav().findIndex((candidate) => candidate.id === item.id);
    if (idx >= 0) this.currentIndex.set(idx);
  }

  /** 统一封装浏览器语音播放，并用 runId 忽略过期回调。 */
  private speakText(text: string, afterEnd?: () => void): void {
    if (!this.canUseSpeech()) {
      this.msg.warning('当前浏览器不支持语音播报。');
      return;
    }
    const clean = this.cleanSpeechText(text);
    if (!clean) return;
    const runId = ++this.speechRunId;
    this.clearChantTimer();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'zh-CN';
    utterance.rate = this.speechRate();
    utterance.pitch = 1;
    utterance.onstart = () => {
      if (runId === this.speechRunId) this.isSpeaking.set(true);
    };
    utterance.onend = () => {
      if (runId !== this.speechRunId) return;
      this.isSpeaking.set(false);
      afterEnd?.();
    };
    utterance.onerror = () => {
      if (runId !== this.speechRunId) return;
      this.isSpeaking.set(false);
      if (this.chantMode()) this.stopSpeech();
    };
    window.speechSynthesis.speak(utterance);
  }

  /** 生成适合朗读的题目文本。 */
  private questionSpeechText(item: PracticeItem): string {
    const tags = item.tags ? `标签，${item.tags}。` : '';
    return `${this.categoryLabel(item.category)}。${tags}题目。${item.question}`;
  }

  /** 生成适合朗读的答案文本，优先包含面试口播一句。 */
  private answerSpeechText(item: PracticeItem): string {
    const oneLiner = item.oralOneLiner?.trim();
    const answer = item.answer?.trim();
    if (oneLiner && answer) return `面试口播一句。${oneLiner}。参考答案。${answer}`;
    if (oneLiner) return `面试口播一句。${oneLiner}`;
    if (answer) return `参考答案。${answer}`;
    return '本题暂未录入参考答案。';
  }

  /** 清理 Markdown、代码片段、链接和多余符号，让 TTS 朗读更自然。 */
  private cleanSpeechText(text: string): string {
    const withoutCodeBlocks = String(text ?? '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/~~~[\s\S]*?~~~/g, ' ')
      .replace(/^(?: {4}|\t).+$/gm, ' ')
      .replace(/`([^`]+)`/g, (_, code: string) => this.inlineCodeForSpeech(code));

    return stripMarkdownForSearch(withoutCodeBlocks)
      .replace(/https?:\/\/\S+/g, '链接')
      .replace(/\b[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+\s*\([^)]*\)/g, ' ')
      .replace(/\b[A-Za-z_$][\w$]*\s*\([^)]*\)/g, ' ')
      .replace(/\b(?:func|function|const|let|var|class|struct|enum|interface|import|export)\s+\S+/gi, ' ')
      .replace(/[|*_>#~[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** inline code 里普通术语保留，明显代码表达式跳过。 */
  private inlineCodeForSpeech(code: string): string {
    const raw = String(code ?? '').trim();
    if (!raw) return ' ';
    if (/[()[\]{}=;]|=>|^\W|[+\-*/%<>]/.test(raw)) return ' ';
    if (/[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+/.test(raw)) return ' ';
    return raw;
  }

  /** 检测当前运行环境是否可用 Web Speech API。 */
  private canUseSpeech(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  /** 单次手动播放前只退出唱题模式，不立即取消本次即将开始的播放。 */
  private stopChantOnly(): void {
    this.chantMode.set(false);
    this.chantPhase.set('idle');
    this.clearChantTimer();
  }

  /** 清理唱题模式的延迟任务。 */
  private clearChantTimer(): void {
    if (this.chantTimer) {
      clearTimeout(this.chantTimer);
      this.chantTimer = null;
    }
  }

  /** 从 sessionStorage 读取字号设置，并限制在允许范围内。 */
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

  /** 从 sessionStorage 读取语速设置，并限制在 TTS 适合的慢速区间内。 */
  private readSpeechRate(): number {
    try {
      const raw = sessionStorage.getItem(SPEECH_RATE_KEY);
      if (!raw) return SPEECH_RATE_DEFAULT;
      const n = Number(raw);
      if (!Number.isFinite(n)) return SPEECH_RATE_DEFAULT;
      return this.normalizeSpeechRate(n);
    } catch {
      return SPEECH_RATE_DEFAULT;
    }
  }

  /** 应用并保存字号设置。 */
  private applyFontScale(p: number): void {
    this.fontScale.set(p);
    try {
      sessionStorage.setItem(FONT_SCALE_KEY, String(p));
    } catch {
      /* ignore */
    }
  }

  /** 应用并保存语速设置。 */
  private applySpeechRate(rate: number): void {
    const normalized = this.normalizeSpeechRate(rate);
    this.speechRate.set(normalized);
    try {
      sessionStorage.setItem(SPEECH_RATE_KEY, String(normalized));
    } catch {
      /* ignore */
    }
  }

  /** 将语速规整到 0.1 档位，避免界面出现长小数。 */
  private normalizeSpeechRate(rate: number): number {
    const clamped = Math.min(SPEECH_RATE_MAX, Math.max(SPEECH_RATE_MIN, rate));
    return Math.round(clamped * 10) / 10;
  }

  /** 从本地存储重新载入题库。 */
  private reloadFromStorage(): void {
    this.items.set(this.storage.load());
    this.clampIndex();
  }

  /** 确保今天有一组每日练习题，并清理已失效的题目 id。 */
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

  /** 按日期和题目 id 稳定抽取每日题目，避免每天刷新后结果变化。 */
  private pickDailyItems(items: PracticeItem[], date: string, count: number): PracticeItem[] {
    if (count <= 0) return [];
    return [...items]
      .sort((a, b) => hashString(`${date}:${a.id}`) - hashString(`${date}:${b.id}`))
      .slice(0, count);
  }

  /** 更新今天的练习记录并持久化。 */
  private updateTodayRecord(updater: (record: PracticeDayRecord) => PracticeDayRecord): void {
    const record = this.todayRecord();
    if (!record) return;
    const state = { records: { ...this.dailyState().records } };
    state.records[this.todayKey()] = updater(record);
    this.dailyState.set(state);
    this.storage.saveDailyState(state);
  }

  /** 每日题目标记后调整当前索引，并重置题目交互状态。 */
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

  /** 当筛选、搜索或题库变化时，将当前索引夹在合法范围内。 */
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

  /** 进入新题时重置答案显隐、自检内容和语音播放。 */
  private resetQuestionUi(): void {
    this.stopSpeech();
    this.showAnswer.set(false);
    this.userAnswer.set('');
    this.compareResult.set(null);
  }
}
