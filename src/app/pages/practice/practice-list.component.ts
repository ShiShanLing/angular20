import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { TextFieldModule } from '@angular/cdk/text-field';

import {
  PRACTICE_CATEGORY_LABELS,
  PRACTICE_CATEGORY_LIST,
  type PracticeCategory,
  type PracticeFilterCategory,
  type PracticeItem,
} from './practice.types';
import {
  PRACTICE_HISTORY_TRACK_LABELS,
  PracticeStorageService,
  reciteScopesForTrack,
  type PracticeHistoryTrack,
  type PracticeStorageScope,
} from './practice-storage.service';
import { builtinSeedForScope } from './practice-builtin-seed';
import { MarkdPipe } from './markd.pipe';
import { PracticeStarredSyncService } from './practice-starred-sync.service';
import { PracticeBankService, type PracticeBankSaveResult } from './practice-bank.service';
import { bundledBankRows, mergeBankRows, practiceItemsFromBank, type PracticeBankRow } from './practice-bank.map';
import { questionSortKey, sortKeyBeforeDisplay } from './practice-sort';
import { isContext } from 'node:vm';
import { isCoordSupported } from 'echarts/types/src/component/dataZoom/helper.js';

type FilterValue = PracticeFilterCategory;

/**
 * 列表刷题 / 科目背题：题目纵向平铺，点击展开答案（手风琴）。
 */
@Component({
  selector: 'app-practice-list',
  imports: [
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzEmptyModule,
    NzBadgeModule,
    TextFieldModule,
    MarkdPipe,
  ],
  templateUrl: './practice-list.component.html',
  styleUrl: './practice-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storage = inject(PracticeStorageService);
  private readonly starredSync = inject(PracticeStarredSyncService);
  private readonly practiceBank = inject(PracticeBankService);
  private bankRows: PracticeBankRow[] = [];
  private serverBankReady = false;
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly reciteTrack = this.readReciteTrack();
  private readonly scopedBank = this.readPracticeScope();
  readonly reciteMode = this.reciteTrack !== null || this.scopedBank !== null;

  /** 题库原始数据 */
  
  allItems = signal<PracticeItem[]>([]);

  readonly pageTitle = computed(() => {
    if (this.reciteTrack) return `${PRACTICE_HISTORY_TRACK_LABELS[this.reciteTrack]} 背题`;
    if (this.scopedBank === 'agent-objective-learning') return 'Agent 选择判断背题';
    if (this.scopedBank === 'agent-learning') return 'Agent 简答题背题';
    return '列表刷题';
  });
  //
  readonly showCategoryTabs = computed(() => {
    const cats = new Set(this.allItems().map((item) => item.category));
    return cats.size > 1;
  });

  /** 当前分类筛选 */
  currentFilter = signal<FilterValue>('all');

  /** 搜索文本 */
  searchText = signal('');

  /** 当前搜索命中游标；-1 表示尚未定位 */
  searchHitIndex = signal(-1);

  /** 背题标星 id */
  starredIds = signal<Set<string>>(new Set());

  /** 仅看标星 */
  starredOnly = signal(false);

  /** 通讯录式题号跳转当前档 */
  activeIndexTick = signal<number | null>(null);
  /** 刚复制成功的题目或答案 */
  copiedKey = signal<string | null>(null);
  /** 正在编辑答案的题目 */
  editingAnswerId = signal<string | null>(null);
  editQuestionDraft = signal('');
  editAnswerDraft = signal('');
  answerSaving = signal(false);
  answerStatus = signal('');
  answerStatusId = signal<string | null>(null);
  addQuestionOpen = signal(false);
  newQuestionText = signal('');
  newAnswerText = signal('');
  newQuestionPlace = signal(1);
  newQuestionSort = signal(1);
  addingQuestion = signal(false);
  addQuestionStatus = signal('');
  private readonly originalAnswers = new Map<string, { question: string; answer: string }>();
  private copyResetTimer = 0;
  private lastSearchEnterAt = 0;
  /** 按住滑动时，显示在手指左侧的放大题号 */
  indexHintTick = signal<number | null>(null);
  indexHintTop = signal(0);
  private indexPointerActive = false;
  private lastIndexPointerTick: number | null = null;
  private indexScrollTarget: EventTarget | null = null;
  private indexScrollRaf = 0;

  /** 展开的题目 ID 集合 */
  expandedIds = signal<Set<string>>(new Set());

  /** 显示答案的题目 ID 集合 */
  revealedIds = signal<Set<string>>(new Set());

  /** 手写记忆输入 */
  memoInputs = signal<Record<string, string>>({});

  /** 分类筛选选项 */
  readonly filterCategories: FilterValue[] = ['all', ...PRACTICE_CATEGORY_LIST];

  readonly starredCount = computed(() => {
    const ids = this.starredIds();
    return this.allItems().filter((item) => ids.has(item.id)).length;
  });

  readonly searchPlaceholder = computed(() => {
    if (!this.reciteMode) return '搜索题目或编号...';
    const count = this.filteredItems().length;
    return this.starredOnly() ? `共 ${count} 题（标星）` : `共 ${count} 题`;
  });

  /** 背题按排序值排列。页面序号是排完之后的 1、2、3。 */
  readonly orderedItems = computed(() => {
    const items = this.allItems();
    if (!this.reciteMode) return items;
    return [...items].sort((a, b) => {
      const diff = questionSortKey(a) - questionSortKey(b);
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });
  });

  readonly displayNumbers = computed(() => {
    const numbers = new Map<string, number>();
    this.orderedItems().forEach((item, index) => numbers.set(item.id, index + 1));
    return numbers;
  });

  /** 筛选后的题目列表。背题一次列出该科目全库，只允许搜索，不按分类裁切。 */
  readonly filteredItems = computed(() => {
    let items = this.orderedItems();
    const filter = this.currentFilter();
    if (!this.reciteMode && filter !== 'all') {
      items = items.filter(i => i.category === filter);
    }
    if (this.reciteMode && this.starredOnly()) {
      const starred = this.starredIds();
      items = items.filter((i) => starred.has(i.id));
    }
    if (!this.reciteMode) {
      items = this.filterItemsBySearch(items, this.searchText());
    }
    return items;
  });

  /** 背题模式下的搜索命中列表，只用于定位跳转，不改变列表本身。 */
  readonly searchResults = computed(() => {
    const kw = this.searchText().trim().toLowerCase();
    if (!kw) return [] as PracticeItem[];
    const numbers = this.displayNumbers();
    return this.filteredItems().filter((item) => {
      if (String(numbers.get(item.id) ?? '') === kw) return true;
      if (item.sort != null && String(item.sort) === kw) return true;
      if (item.no != null && String(item.no) === kw) return true;
      return (
        item.question.toLowerCase().includes(kw) ||
        item.answer.toLowerCase().includes(kw) ||
        item.tags.toLowerCase().includes(kw)
      );
    });
  });

  readonly searchHitLabel = computed(() => {
    const total = this.searchResults().length;
    if (!total) return '0 / 0';
    const index = this.searchHitIndex();
    if (index < 0) return `— / ${total}`;
    return `${index + 1} / ${total}`;
  });

  /** 右侧快捷条：有题的十位，例如 0、10、20。 */
  readonly indexTicks = computed(() => {
    if (!this.reciteMode) return [] as number[];
    const ticks = new Set<number>();
    this.filteredItems().forEach((item) => {
      ticks.add(Math.floor(this.displayNo(item) / 10) * 10);
    });
    return [...ticks].sort((a, b) => a - b);
  });

  /** 是否全部展开 */
  readonly allExpanded = computed(() => {
    const items = this.filteredItems();
    if (items.length === 0) return false;
    return items.every(i => this.expandedIds().has(i.id));
  });

  /*

  循环引用是两个或多个对象互相强持有，导致引用计数无法归零。常见场景有 VC 强持有闭包，闭包强捕获 self；Timer 强持有 target；delegate 用 strong；对象之间互相 strong。解决方式是 weak/unowned、invalidate、解除观察或重新设计所有权。
  
  */
  
  // MARK: 初始化
  // 组件初始化：同步移动端断点、订阅视口变化与路由事件
  
  ngOnInit() {
    const scopes = this.scopesToLoad();
    this.ensureSeeds(scopes);
    const loaded = this.loadItems(scopes);
    this.rememberOriginalAnswers(loaded);
    this.allItems.set(loaded);
    this.destroyRef.onDestroy(() => {
      window.clearTimeout(this.copyResetTimer);
      this.unbindIndexScrollSpy();
    });
    if (this.reciteMode) {
      afterNextRender(() => requestAnimationFrame(() => this.bindIndexScrollSpy()), { injector: this.injector });
    }
    const track = this.starredTrack();
    if (track) {
      this.starredIds.set(new Set(this.storage.readStarredIds(track)));
      this.starredSync
        .pull(track)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((ids) => this.starredIds.set(new Set(ids)));
      this.bankRows = bundledBankRows(track);
      this.practiceBank
        .load(track)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((serverRows) => {
          if (!serverRows) return;
          this.serverBankReady = true;
          this.bankRows = mergeBankRows(this.bankRows, serverRows);
          this.allItems.set(practiceItemsFromBank(track, this.bankRows, Date.now()));
        });
    }
  }
  
  private scopesToLoad(): PracticeStorageScope[] {
    if (this.reciteTrack) return reciteScopesForTrack(this.reciteTrack);
    if (this.scopedBank) return [this.scopedBank];
    return [
      'practice',
      'ios-learning',
      'ios-objective-learning',
      'android-learning',
      'android-objective-learning',
      'angular-learning',
      'angular-objective-learning',
      'ts-learning',
      'ts-objective-learning',
      'agent-objective-learning',
      'agent-learning',
    ];
  }

  private ensureSeeds(scopes: PracticeStorageScope[]): void {
    const now = Date.now();
    for (const scope of scopes) {
      const seeded = builtinSeedForScope(scope, now);
      if (!seeded.length) continue;
      const existing = this.storage.load(scope);
      if (existing.length === 0) {
        this.storage.save(seeded, scope);
      } else {
        this.storage.mergeItems(seeded, scope);
      }
      if (scope === 'frontend-learning') {
        const ids = new Set(seeded.map((item) => item.id));
        const current = this.storage.load(scope);
        const kept = current.filter((item) => ids.has(item.id));
        if (kept.length !== current.length) {
          this.storage.save(kept, scope);
        }
      }
    }
  }

  private loadItems(scopes: PracticeStorageScope[]): PracticeItem[] {
    const merged: PracticeItem[] = [];
    const seenIds = new Set<string>();
    const seenQuestions = new Set<string>();
    const pushUnique = (item: PracticeItem) => {
      if (this.reciteMode && this.isChoiceQuestion(item)) return;
      const questionKey = this.reciteTrack === 'frontend'
        ? item.id
        : `${item.category}::${item.question.trim()}`;
      if (seenIds.has(item.id) || seenQuestions.has(questionKey)) return;
      seenIds.add(item.id);
      seenQuestions.add(questionKey);
      merged.push(item);
    };

    if (this.reciteMode) {
      const now = Date.now();
      for (const scope of scopes) {
        for (const item of builtinSeedForScope(scope, now)) {
          pushUnique(item);
        }
        for (const item of this.storage.load(scope)) {
          pushUnique(item);
        }
      }
      return merged;
    }

    for (const scope of scopes) {
      for (const item of this.storage.load(scope)) {
        pushUnique(item);
      }
    }
    return merged;
  }

  private readReciteTrack(): PracticeHistoryTrack | null {
    const track = this.route.snapshot.data['reciteTrack'];
    if (track === 'ios' || track === 'android' || track === 'angular' || track === 'ts' || track === 'agent' || track === 'frontend') {
      return track;
    }
    return null;
  }

  private readPracticeScope(): PracticeStorageScope | null {
    const scope = this.route.snapshot.data['practiceScope'];
    if (
      scope === 'agent-learning' ||
      scope === 'agent-objective-learning'
    ) {
      return scope;
    }
    return null;
  }

  // MARK: 获取
  getCategoryLabel(cat: FilterValue): string {
    if (cat === 'all') return '全部';
    return PRACTICE_CATEGORY_LABELS[cat] || cat;
  }

  // MARK: 获取
  getCategoryColor(cat: PracticeCategory): string {
    const colors: Record<string, string> = {
      ios: 'blue',
      angular: 'red',
      android: 'green',
      'angular-ts': 'orange',
      'angular-js': 'cyan',
      'angular-css': 'purple',
      agent: 'geekblue',
    };
    return colors[cat] || 'default';
  }

  // MARK: 设置
  setFilter(cat: FilterValue) {
    this.currentFilter.set(cat);
    this.searchHitIndex.set(-1);
  }

  // MARK: 搜索
  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.searchHitIndex.set(-1);
  }

  /** 手机键盘「搜索/换行」常不走 keydown.enter，统一在这里处理并防重复触发。 */
  onSearchEnter(event: Event): void {
    event.preventDefault();
    const now = Date.now();
    if (now - this.lastSearchEnterAt < 300) return;
    this.lastSearchEnterAt = now;
    this.goSearchHit(1);
  }

  goSearchHit(delta: 1 | -1): void {
    const results = this.searchResults();
    if (!results.length) return;
    const current = this.searchHitIndex();
    const next =
      current < 0
        ? delta > 0
          ? 0
          : results.length - 1
        : (current + delta + results.length) % results.length;
    this.searchHitIndex.set(next);
    this.expandQuestion(results[next].id);
  }

  // MARK: 标星
  isStarred(id: string): boolean {
    return this.starredIds().has(id);
  }


  startAnswerEdit(item: PracticeItem, ev: Event): void {
    
    ev.stopPropagation();
    this.editingAnswerId.set(item.id);
    this.editQuestionDraft.set(item.question);
    this.editAnswerDraft.set(item.explanation || item.answer);
    this.answerStatus.set('');
    this.answerStatusId.set(item.id);
  }
  
  cancelAnswerEdit(): void {
    this.editingAnswerId.set(null);
    this.answerSaving.set(false);
  }

  
  toggleAddQuestion(): void {
    const open = !this.addQuestionOpen();
    this.addQuestionOpen.set(open);
    if (open) {
      this.addQuestionStatus.set('');
      this.prepareNewQuestionPlace(this.orderedItems().length + 1);
    }
  }
  
  /*
  


  */
  onNewQuestionPlace(value: number | string): void {
    const place = Number(value);
    if (!Number.isFinite(place)) return;
    this.prepareNewQuestionPlace(place);
  }

  onNewQuestionSort(value: number | string): void {
    const sort = Number(value);
    if (!Number.isFinite(sort)) return;
    this.newQuestionSort.set(sort);
  }
  //
  submitNewQuestion(): void {
    const track = this.starredTrack();
    const question = this.newQuestionText().trim();
    const answer = this.newAnswerText().trim();
    const sort = this.newQuestionSort();
    if (!track || this.addingQuestion()) return;
    if (!question || !answer) {
      this.addQuestionStatus.set('题目和答案都不能为空');
      return;
    }
    if (!Number.isFinite(sort)) {
      this.addQuestionStatus.set('排序值不对');
      return;
    }
    
  
    this.addingQuestion.set(true);
    this.practiceBank
      .create({ track, question, answer, sort })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.addingQuestion.set(false);
        if (result.status === 'server' && result.row) {
          this.bankRows = [...this.bankRows, result.row];
          this.allItems.set(practiceItemsFromBank(track, this.bankRows, Date.now()));
          this.newQuestionText.set('');
          this.newAnswerText.set('');
          this.prepareNewQuestionPlace(this.orderedItems().length + 1);
          this.addQuestionStatus.set('已添加到服务器题库');
          return;
        }
        
        
        this.addQuestionStatus.set(
          result.status === 'local-only' ? '登录后才能添加到服务器' : '没写进服务器，请再试一次',
        );
      });
  }

  onQuestionFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const track = this.starredTrack();
    if (!file || !track || this.addingQuestion()) return;
    void file.text().then((text) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        this.addQuestionStatus.set('这个 JSON 文件读不了');
        return;
      }
      const questions = this.rowsFromQuestionFile(parsed);
      if (!questions) {
        this.addQuestionStatus.set('JSON 需要是题目数组，或包含 questions 数组');
        return;
      }

      this.addingQuestion.set(true);
      this.practiceBank
        .importQuestions(track, questions)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (result.status !== 'server') {
            this.addingQuestion.set(false);
            this.addQuestionStatus.set(
              result.status === 'local-only' ? '登录后才能上传到服务器' : '上传没写进服务器',
            );
            return;
          }
          this.practiceBank
            .load(track)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((rows) => {
              this.addingQuestion.set(false);
              if (rows) {
                this.bankRows = mergeBankRows(bundledBankRows(track), rows);
                this.allItems.set(practiceItemsFromBank(track, this.bankRows, Date.now()));
              }
              this.addQuestionStatus.set(`已添加 ${result.added} 题，跳过 ${result.skipped} 题`);
            });
        });
    });
  }
  /*
  
  项目有一个九宫格图片上传功能,有用户反馈可能会照成应用闪退,但是bugly闪退日志里没有业务堆栈,我们自己测试,使用公司测试机上传满9张图片有些卡顿,后来使用内存检查工具发现没上传一张图片内存就上涨一些.通过查资料了解到UIImag如果展示远超与本身的大图会照成内存压力.
  后面使用的解决方案是,在拍照获取到UIImage对象后,压缩一份缩略图,然后保留一份JPEG data.这样性能好了很多.点击图片查看时再把Data转换成UIImage.
  
  */
  private prepareNewQuestionPlace(place: number): void {
    this.newQuestionPlace.set(place);
    this.newQuestionSort.set(sortKeyBeforeDisplay(this.orderedItems(), place));
  }
  
  private rowsFromQuestionFile(parsed: unknown): PracticeBankRow[] | null {
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { questions?: unknown }).questions)
        ? (parsed as { questions: unknown[] }).questions
        : null;
    if (!rows) return null;
    return rows.filter((row): row is PracticeBankRow => !!row && typeof row === 'object' && !Array.isArray(row));
  }
  
  saveAnswerEdit(item: PracticeItem): void {
    const track = this.starredTrack();
    if (!track || this.answerSaving()) return;
    const answer = this.editAnswerDraft();
    if (!answer.trim()) {
      this.answerStatus.set('答案不能为空');
      this.answerStatusId.set(item.id);
      return;
    }


    
    const question = this.editQuestionDraft().trim() || item.question;
    this.answerSaving.set(true);
    this.practiceBank
      .save({
        track,
        questionId: item.id,
        question,
        answer,
      })
      
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.answerSaving.set(false);
        if (result === 'server') this.serverBankReady = true;
        this.bankRows = this.bankRows.map((row) =>
          String(row['id']) === item.id ? { ...row, question, answer } : row,
        );
        this.allItems.update((items) =>
          items.map((row) => (row.id === item.id ? { ...row, answer, question } : row)),
        );
        this.editingAnswerId.set(null);
        this.answerStatusId.set(item.id);
        this.answerStatus.set(this.answerSaveStatus(result));
      });
      
      /*
      KVO:键值观察
      KVC:键值编码
      */
  }
  
  
  restoreOriginalAnswer(item: PracticeItem): void {
    const track = this.starredTrack();
    const original = this.originalAnswers.get(item.id);
    if (!track || !original) return;
    const applyOriginal = () => {
      this.bankRows = this.bankRows.map((row) =>
        String(row['id']) === item.id
          ? { ...row, question: original.question, answer: original.answer }
          : row,
      );
      this.allItems.update((items) =>
        items.map((row) =>
          row.id === item.id ? { ...row, question: original.question, answer: original.answer } : row,
        ),
      );
      this.editingAnswerId.set(null);
      this.answerStatusId.set(item.id);
      this.answerStatus.set('已恢复这道题原来的题目和答案');
    };
    if (!this.serverBankReady) {
      applyOriginal();
      return;
    }
    
    this.practiceBank
      .save({
        track,
        questionId: item.id,
        question: original.question,
        answer: original.answer,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        applyOriginal();
        if (result !== 'server') {
          this.answerStatus.set('这台浏览器已恢复原文，服务器题库没写成功');
        }
      });
  }
  //
  //
  private answerSaveStatus(result: PracticeBankSaveResult): string {
    if (result === 'server') return '已写入服务器题库，打开页面就会读到这版';
    if (result === 'failed') return '这台浏览器已经改好，服务器题库没写成功';
    return '已改在这台浏览器。登录后才会写入服务器题库';
  }

  private rememberOriginalAnswers(items: PracticeItem[]): void {
    for (const item of items) {
      if (!this.originalAnswers.has(item.id)) {
        this.originalAnswers.set(item.id, { question: item.question, answer: item.answer });
      }
    }
  }
  //
  copyText(text: string, key: string, ev: Event): void {
    ev.stopPropagation();
    const value = text.trim();
    if (!value) return;
    const done = () => {
      this.copiedKey.set(key);
      window.clearTimeout(this.copyResetTimer);
      this.copyResetTimer = window.setTimeout(() => {
        if (this.copiedKey() === key) this.copiedKey.set(null);
      }, 1200);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(() => this.copyWithTextarea(value, done));
      return;
    }
    this.copyWithTextarea(value, done);
  }
  //
  
  private copyWithTextarea(value: string, done: () => void): void {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    done();
  }

  toggleStar(id: string, ev: Event): void {
    ev.stopPropagation();
    const track = this.starredTrack();
    if (!track) return;
    const next = this.storage.toggleStarred(track, id);
    this.starredIds.set(new Set(next));
    this.starredSync.setStarred(track, id, next.includes(id));
    if (this.starredOnly() && !next.includes(id) && this.expandedIds().has(id)) {
      this.expandedIds.set(new Set());
      this.revealedIds.set(new Set());
    }
  }

  toggleStarredOnly(): void {
    if (!this.starredCount() && !this.starredOnly()) return;
    this.starredOnly.update((v) => !v);
    this.expandedIds.set(new Set());
    this.revealedIds.set(new Set());
  }

  private starredTrack(): PracticeHistoryTrack | null {
    if (this.reciteTrack) return this.reciteTrack;
    if (this.scopedBank === 'agent-learning' || this.scopedBank === 'agent-objective-learning') {
      return 'agent';
    }
    return null;
  }
  //
  // MARK: 切换
  toggleExpand(id: string) {
    if (this.expandedIds().has(id)) {
      this.expandedIds.set(new Set());
      this.revealedIds.set(new Set());
      return;
    }
    this.expandQuestion(id);
  }

  private expandQuestion(id: string): void {
    this.expandedIds.set(new Set([id]));
    this.revealedIds.set(this.reciteMode ? new Set([id]) : new Set());
    if (this.reciteMode) {
      this.scrollCardIntoView(id);
    }
  }

  private scrollExpandedCardToTop(id: string): void {
    const root = this.host.nativeElement as HTMLElement;
    const card = root.querySelector(`[data-question-id="${this.cssEscape(id)}"]`) as HTMLElement | null;
    if (!card) return;
    const sticky = root.querySelector('.list-head-sticky') as HTMLElement | null;
    const scroller = this.findScrollParent(card);
    const frameGap = 8;;
    const targetTop =
      (sticky?.getBoundingClientRect().bottom ??
        (scroller === window ? 0 : (scroller as HTMLElement).getBoundingClientRect().top)) + frameGap;
    const delta = card.getBoundingClientRect().top - targetTop;
    if (Math.abs(delta) < 1) return;
    if (scroller === window) {
      window.scrollBy({ top: delta, behavior: 'auto' });
      return;
    }
    (scroller as HTMLElement).scrollBy({ top: delta, behavior: 'auto' });
  }
  
  private findScrollParent(el: HTMLElement): HTMLElement | Window {
    let current = el.parentElement;
    while (current) {
      const style = getComputedStyle(current);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight + 1) {
        return current;
      }
      current = current.parentElement;
    }
    return window;
  }

  private cssEscape(value: string): string {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(value);
    }
    return value.replace(/["\\]/g, '\\$&');
  }

  private isChoiceQuestion(item: PracticeItem): boolean {
    return item.questionType === 'trueFalse' || item.questionType === 'single' || item.questionType === 'multiple';
  }

  private filterItemsBySearch(items: PracticeItem[], rawSearchText: string): PracticeItem[] {
    const kw = rawSearchText.trim().toLowerCase();
    if (!kw) return items;
    return items.filter(i =>
      (i.no != null && String(i.no) === kw) ||
      i.question.toLowerCase().includes(kw) ||
      i.answer.toLowerCase().includes(kw) ||
      i.tags.toLowerCase().includes(kw)
    );
  }
  //
  displayNo(item: PracticeItem): number {
    return this.displayNumbers().get(item.id) ?? 0;
  }
  //
  questionNo(item: PracticeItem, index = 0): number {
    return this.reciteMode ? this.displayNo(item) : (item.no ?? index + 1);
  }
  //
  indexTargetId(tick: number): string | null {
    const items = this.filteredItems();
    const target = items.find((item) => this.displayNo(item) >= tick);
    return target?.id ?? null;
  }

  jumpToIndexTick(tick: number): void {
    const id = this.indexTargetId(tick);
    if (!id) return;
    this.activeIndexTick.set(tick);
    this.scrollCardIntoView(id);
  }

  onIndexPointerDown(event: PointerEvent): void {
    this.indexPointerActive = true;
    this.lastIndexPointerTick = null;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.jumpFromIndexPointer(event);
  }

  onIndexPointerMove(event: PointerEvent): void {
    if (!this.indexPointerActive) return;
    this.jumpFromIndexPointer(event);
  }
  /*


    


    
  */
  

  onIndexPointerEnd(): void {
    this.indexPointerActive = false;
    this.lastIndexPointerTick = null;
    this.indexHintTick.set(null);
    this.syncActiveIndexFromScroll();
  }
  
  private readonly onIndexListScroll = (): void => {
    if (this.indexPointerActive || this.indexScrollRaf) return;
    this.indexScrollRaf = requestAnimationFrame(() => {
      this.indexScrollRaf = 0;
      if (!this.indexPointerActive) this.syncActiveIndexFromScroll();
    });
  };
  /*
  
  */
  private bindIndexScrollSpy(): void {
    const root = this.host.nativeElement as HTMLElement;
    const card = root.querySelector('.question-card') as HTMLElement | null;
    if (!card) return;
    const scroller = this.findScrollParent(card);
    const target: EventTarget = scroller === window ? window : scroller;
    if (this.indexScrollTarget !== target) {
      this.unbindIndexScrollSpy();
      target.addEventListener('scroll', this.onIndexListScroll, { passive: true });
      this.indexScrollTarget = target;
    }
    this.syncActiveIndexFromScroll();
  }
  
  private unbindIndexScrollSpy(): void {
    if (this.indexScrollRaf) {
      cancelAnimationFrame(this.indexScrollRaf);
      this.indexScrollRaf = 0;
    }
    this.indexScrollTarget?.removeEventListener('scroll', this.onIndexListScroll);
    this.indexScrollTarget = null;
  }
  
    /*
    结构化并发和非结构化任务：需要说明生命周期
    Task:生命周期相关说错了.而且配合async/await创建什么?没说出来
    runloop有些话没说对.通过和AI聊天才了解清楚,常驻线程和子线程runloop创建方式.
    可测试的网络层:
    App启动流程
    大图加载卡顿

    
    OOM:系统因为内存压缩杀掉应用进程.这种崩溃没有日志,只能通过Xcode instrments进行排查,看看是哪里内存泄露,哪个功能造成的内存飙升而导致系统杀掉应用.
    App 包体积优化:
      静态资源:删除无用的静态资源,压缩图片.可以将部分静态库可以改为动态库,但是动态库可能会提升启动时间,所以这个两边需要做均衡.
      二进制文件:打包时要删除无用GPU框架 只保留真机所需要的ARM框架.
      删除无用代码和无用pod引用.
      使用LinkMap把符号和目标文件按大小排列,看看到底是哪个符号,哪个库对安装包的体积贡献最大.
    Mach-O是什么:Mach-O时Apple平台的可执行文件,他负责在启动时加载可执行文件和动态库.
    静态库和动态库有什么区别？:
      动态库是在App启动时由dyld加载,不会被拷贝到主工程中.链接方使用时只会保留用到的公开符号.所以不会导致安装包体积变大,但是会导致启动成本增加.
      静态库:是在编译期由runtime拷贝到目标工程,多次链接都会有多次copy,但是在运行期少了一次加载.
    Link Map 能看什么？如何用它分析二进制体积和大符号？:
    LinkMap.能看具体目标文件和符号大小.根据这个可以排查哪个库哪个符号占用安装包体积最大.
    +load +initalaze:
    +load是在App冷启动时,main函数之前调用.每个类和分类都会调用.
    +initalaze是在类首次收到消息时调用.只会被调用一次.



    
    

    */

  private syncActiveIndexFromScroll(): void {
    const root = this.host.nativeElement as HTMLElement;
    const cards = [...root.querySelectorAll<HTMLElement>('.question-card')];
    if (cards.length === 0) return;
    const firstTop = cards[0].getBoundingClientRect().top;
    const lastTop = cards[cards.length - 1].getBoundingClientRect().top;
    if (cards.length > 1 && firstTop === lastTop) return;
    
    const sticky = root.querySelector('.list-head-sticky') as HTMLElement | null;
    const scroller = this.findScrollParent(cards[0]);
    const line =
      (sticky?.getBoundingClientRect().bottom ??
        (scroller === window ? 0 : (scroller as HTMLElement).getBoundingClientRect().top)) + 12;
    
    let no = Number(cards[0].dataset['questionNo']);
    for (const card of cards) {
      if (card.getBoundingClientRect().top > line) break;
      const value = Number(card.dataset['questionNo']);
      if (Number.isFinite(value)) no = value;
    }
    
    if (!Number.isFinite(no)) return;
    const tick = Math.floor(no / 10) * 10;
    if (this.activeIndexTick() !== tick) {
      this.activeIndexTick.set(tick);
    }
  }

  private jumpFromIndexPointer(event: PointerEvent): void {
    const ticks = this.indexTicks();
    if (ticks.length === 0) return;
    const rail = event.currentTarget as HTMLElement;
    const rect = rail.getBoundingClientRect();
    if (rect.height <= 0) return;
    const ratio = (event.clientY - rect.top) / rect.height;
    const index = Math.min(ticks.length - 1, Math.max(0, Math.floor(ratio * ticks.length)));
    const tick = ticks[index];
    const tickEl = rail.querySelectorAll('.index-tick')[index] as HTMLElement | undefined;
    if (tickEl) {
      const tickRect = tickEl.getBoundingClientRect();
      this.indexHintTop.set(tickRect.top - rect.top + tickRect.height / 2);
    }
    
    this.indexHintTick.set(tick);
    if (tick === this.lastIndexPointerTick) return;
    this.lastIndexPointerTick = tick;
    this.jumpToIndexTick(tick);
  }
  //
  private scrollCardIntoView(id: string): void {
    afterNextRender(
      () => requestAnimationFrame(() => this.scrollExpandedCardToTop(id)),
      { injector: this.injector },
    );
  }


  isCorrectOption(item: PracticeItem, optionId: string): boolean {
    return (item.correctAnswers ?? []).includes(optionId);
  }
  
  // MARK: 切换
  toggleAnswer(id: string) {
    const set = new Set(this.revealedIds());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.revealedIds.set(set);
  }
  
  // MARK: 切换,
  toggleAllAnswers() {
    if (this.allExpanded()) {
      // 全部隐藏答案
      this.revealedIds.set(new Set());
    } else {
      // 全部显示答案 + 展开
      // +load 运行时
      const ids = this.filteredItems().map(i => i.id);
      this.expandedIds.set(new Set(ids));
      this.revealedIds.set(new Set(ids));
    }
  }
  // MARK: 列
  collapseAll() {
    this.expandedIds.set(new Set());
    this.revealedIds.set(new Set());
  }
  
  // MARK: 设置 
  // 更新指定题目的手写记忆输入。
  setMemo(id: string, value: string) {
    this.memoInputs.update((memos) => ({ ...memos, [id]: value }));
  }
  /*

Block的本质:
@autoclosure:

  

KVC:键值编码,使用字符串读取和写入属性的一直方式.
    取值使用 valueforkey 先查找方法 getName name  isname.如果找不到,如果实例对象允许访问成员变量,就找 _name _isname, name isname  .如果还没有就走 valueforundfindkey,如果不处理就会触发崩溃.
    写入值使用setValue forkey,先查找setName,如果没有就按照前面说的顺序查找变量.如果还找不到就会走setValueForUndefindKey.不处理就会崩溃.
KVO:键值观察runtime会动态生成一个被观察类的子类,并在子类中重写setter方法.在setter方法中执行 willchange 和didchange方法,这样属性变化时外界就能知道.
    OC的KVO需要手动add和remove管理不好容易崩溃,swift的block kvo 使用token管理观察关系.相对安全,但本质仍是runtime KVO.
iOS通知的原理: iOS的通知APNs,App去通过API向APNs注册 dev token,然后吧dev token交给服务端,当需要发消息给用户时,服务端拿着dev token和需要发送的消息交给 APNs,然后由 APNs识别具体设备然后发消息过去.
Block类型:未获取任何变量的block是全局block,获取了局部变量的block可能是栈block,对栈block进行copy就会变成堆block.
Block为什么要使用copy:因为普通block可能存在栈上,在函数执行完毕后可能就会被一起销毁.所以在一些要求block存活时间超出函数的场景时,需要使用copy.
Block的本质:
  Block本质是一个对象.它里面有isa,flags,invoke指针,descriptor, 以及捕获到的变量.
  invoke指向真正执行的函数地址.descriptor保存的有block大霄,dispose/copy辅助函数等信息.如果捕获了变量,那么被捕获的变量也会成为block的一部分保存.
  所以block可以像函数一样调用,又能像对象一样release copy,并参加ARC内存管理.
@escaping:逃逸闭包,swift中,当输入的闭包有可能在函数返回后才执行,就可以使用逃逸闭包.常用场景网络请求回调.
@autoclosure:自动闭包 把一个表达式包装成无参闭包,来调用方看起来像传值,内部却可以延迟执行.他能提升可读性,但滥用会隐藏执行时机.
    Codable:是swift中用来做json和数据模型转换的协议.严格说他是一个类型别名,它包含了decode 和 encode两个协议.使用时需要注意可能为空的值,名称和json不同的值,需要额外做处理.
    Runtime消息派发机制:
      方法调用其实就是发消息,通过objc_msgSend 会根据对象的isa站到对应的类. 首先会查找方法缓存列表,如果找不到就去类方法列表中查找,还找不到就沿着父类去查找.缓存命中是性能的关键. 如果前面说的流程都找不到,就开始消息动态转发给三次补救机会.
      方法动态解析,快速转发,最后是完整消息转发.在这三步中任何一步对消息进行处理,程序都不会崩溃.

    Method Swizzling 的原理是什么？有哪些风险？方法件交换就是通过Runtime交换两个方法的IMP,让原调用走新实现,但是要注意保留原调用路径.风险就是虽然强大,但是全局生效,容易和第三方库冲突,递归调用,难调试.
Class 和 Meta Class:
    对象的isa指向Class,Class保存实例方法,属性和协议等信息,所以调用的实例方法,就是在class中查找.
    class的isa指向 mete class, metaclass 保存的是类方法,所以调用类的方法就是在meta class中查找.meta class也有自己的继承链.跟元类的isa指向自己.

Category 和 Extension 有什么区别:
      Category:分类,一般用在编译期给现有类附加方法列表.常用于功能拆分和给系统类添加方法,更像是后期扩展.
      Extension:类扩展,一般写在主实现文件内,可以添加私有方法和属性,并在编译期参与类的构建.更像是私有匿名接口.

    离屏渲染:本来图层可以直接参与屏幕渲染,但是由于有些效果需要先拿到图层的渲染结果,所以系统就开辟一块缓冲期去画这块图层并把效果做好,然后拿出来合成到屏幕中.这个过程中多了一次离屏渲染然后回到主屏幕合成的过程.
    当在高速滑动的列表中或动画中大量的出发离屏渲染就可能会出现掉帧.
    常见的离屏渲染触发原因有切圆角,阴影,mask和模糊效果,多透明图层重叠.
    切圆角可以做预处理或让服务端处理,也可以自己使用贝塞尔曲线画,阴影要设置shadowPath,不要让系统动态估算阴影形状.圆角和阴影不要设置在同一图层, 复杂的mask和模糊效果可以预渲染成图片.减少透明重叠和alpha混合
    可以使用Xcode的Instruments辅助排查

    响应链:响应链是手势事件的传递链,通过hit_test找到对应的view,如果他不做处理,就沿着 supview viewController windos application向上传递.简单的说响应链就是事件逐渐向上传递的过程.
GCD

    
    离屏渲染:本来图层可以直接参与屏幕渲染,但是由于有些效果需要先拿到图层的渲染结果,所以系统就开辟一块缓冲期去画这块图层并把效果做好,然后拿出来合成到屏幕中.这个过程中多了一次离屏渲染然后回到主屏幕合成的过程.
    当在高速滑动的列表中或动画中大量的出发离屏渲染就可能会出现掉帧.
    常见的离屏渲染触发原因有切圆角,阴影,mask和模糊效果,多透明图层重叠.
    切圆角可以做预处理或让服务端处理,也可以自己使用贝塞尔曲线画,阴影要设置shadowPath,不要让系统动态估算阴影形状.圆角和阴影不要设置在同一图层, 复杂的mask和模糊效果可以预渲染成图片.减少透明重叠和alpha混合
    可以使用Xcode的Instruments辅助排查

    响应链:响应链是手势事件的传递链,通过hit_test找到对应的view,如果他不做处理,就沿着 supview viewController windos application向上传递.简单的说响应链就是事件逐渐向上传递的过程.
    
    GCD:GCD是iOS中的基于队列的多线程任务调度工具,它的核心是吧任务提交到队列中,系统负责在线程池里调度执行
    他有两个重要概念任务和队列:
      任务,同步任务异步任务,同步任务是指任务提交到队列中会等待任务完成后才返回,异步任务则不等待直接返回.
      队列:串行和并行.串行是指任务的提交顺序和完成顺序是一定的,并行队列任务提交的顺序和任务完成顺序可能不一致.
      GCD中是否创建子线程,不是由任务和队列类型决定,而是系统调度自动决定的.
    actor:actor是swift中用来保护可变属性的一种"引用类型".它内部的可变属性,同时只允许一个任务进行读写,其他任务如果想要访问和修改必须使用await排队进入.也就是说他可以有效的解决多个任务同时访问一个可变数据导致的数据竞争问题.
    actor Isolation：actor隔离就是指 actor对自身状态的一种隔离规则,这些状态就是他内部的可变属性,这些属性在actor内部可以直接访问,但是外部访问必须使用await排队.同一时间只能有一个任务操作这些可变属性. 有效的解决了多个任务数据竞争问题.
    MainActor:mainActor标记一块代码,让这块代码固定在主线程执行,跨并发环境调用调用必须使用await,swift会自动切换到主线程执行,并检查不安全的UI访问.
    Sendable:表示对象或者值可以安全的跨并发环境使用.值类型默认Sendable,拥有可变属性的class默认不Sendable. unCheck sendable 表示开发者向编译器承诺自己保证安全.

@Sendable和普通闭包的区别:普通闭包没有跨并发域捕获变量的约束,@Sendable,如果在跨并发环境捕获了不安全的变量,编译期会报错警告,代表这个变量可能在别的地方被修改.出现并发问题.
结构化并发和非结构化任务：
      结构化并发:结构化并发,任务有明显的父子关系,父任务需要等待子任务的完成,父任务取消子任务也会被取消,子任务的错误会传递给父任务,生命周期更好管理.
      非结构化任务:非结构化任务一般使用Task创建,他不默认和当前代码作用域绑定,也就是函数返回后他可能还在跑.适合执行超出当前代码域仍需要存活的任务.但是需要自己保存和取消
Task:Task是swift中的异步任务执行单位,需要配合async/await使用创建异步上下文. 他是非结构化任务,需要注意生命周期,取消和对self的捕获.
async/await:是swift中的语言级异步模型,关注吧异步工作流程按顺序编写.并集成了错误,可取消,结构化并发.现代的一些 异步工作流程,并发请求,可取消任务都可以优先使用async/await
runloop(一系列,常驻线程,timer不准确,和线程的管理):主线程的Runloop是可以说App的心脏,不过它有事做事工作,没事做时休眠.source,timer,都是添加到runloop中  主线程的runloop默认就创建好了,子线程是懒创建的.
    常说的常驻线程就是启动子线程的runloop,在runkoop中添加任务(timer或port),让runloop进入等待状态留住线程
    开发中遇到的timer不准确和runloop也有一些关系.比如列表滑动时runloop会进入Trking mode,这时添加到默认mode的timer就可能会延迟执行,需要把他加入common mode就可以解决.

Weak为什么在对象释放后会变成nil:Runtime维护的有一张弱引用表,本质是哈希表,key是对象的地址,value是所有指向该对象的weak指针,当该对象的引用计数为0后,runtime会找出对应的所有weak指针,将他们置为nil.
timer循环引用:timer循环引用是指,self强引用了timer timer中的target又强引用self.解决方案:
  1.将timer置为nil并使用invalidate.
  2.使用__weak 弱引用self
  3.使用block timer + [weak self];
  4.使用代理对象.
可测试的网络层:业务代码不直接调用URLSession,依赖的是一个发请求的协议,实际发出请求的是遵守协议的对象,线上环境使用真实请求服务器数据的对象,测试时使用返回测试数据的对象.
依赖注入:依赖注入就是往业务代码中注入依赖,方式有几种:1.构造器注入.2属性注入.3全局服务注入. 构造器注入对象创建好依赖就可以使用了.属性注入可能对象创建好在使用依赖时还没初始化.全局服务注入也是对象创建好就可以使用,但是他是黑盒,不方便测试.


    模块化（分层，依赖， 跳转）：
      模块化就是把代码根据业务根成一个个小模块,比如登录模块,支付模块.用户模块.每个模块复杂不同的功能.大白话说就是分地盘谁负责什么功能,谁能调用谁.
      模块之间应做好分层,并且需要避免相互依赖.
      比如主工程,业务层,网络和一些协议的服务层.大致可以分三层,要要明显的上下层关系.上层可以调用/依赖下层,反之则不行,同层之间也要避免循环依赖.
      避免模块循环依赖的方法:

    模块化和组件化的区别：
      模块化:模块化关注的是业务功能的拆分,比如登录模块,支付模块.
      组件化;组件化关注的是功能的复用,比如九宫格图片上传组件,比如表单提交组件.他们可能在项目中的任何地方都用得到.
    如何避免模块之间循环依赖？:协议下沉和依赖倒置.协议下沉是指两个模块都需要用到的协议接口,需要放到更底层去.依赖倒置是指,模块可以依赖于协议.但是不能依赖于具体的模块.

App启动流程:启动分为冷启动和热启动.冷启动流程:
    main前:用户点击App图标,系统创建进程,dyld加载Mch-O文件和动态库.完成地址重定位和符号加载.创建runtime加载类和分类,执行+load.然后进入main,
    main后:进入UIApplicationMain,然后创建Application,进入didFinishLunching,再后来就是进入首屏创建工作.创建AppDelegate SecnDelegate,Window,rootViewController,加载view,布局,提交首帧
    App启动优化:
    main前:首先减少动态库加载数量,能合并的合并,也可以转为静态库.减少不必要的类和分类.+load中不要做太重的活.
    main后:主要是首屏加载相关工作优化,尽量避免在didFinichLunching中做太多I/O操作, 非必要的第三方库可以延迟初始化,减少非必要的网络请求,任何能延后的操作都延后.首屏布局不要太复杂,视图层级不要太多.避免加载大图.

    大图加载卡顿:
      大图加载卡顿优化方案,尽量避免直接解码并加载远大于实际展示大小的图片,可以按照实际展示大小解码然后再展示,第三方库sd_webImage提供的就有对应的方法可以实现.
      也可以页面只展示缩略图,点击放大才展示原本图片.
    降低内存峰值:
      1.大数组分段循环
      2.避免解码展示远大于实际展示尺寸的图片.
      3.如果有循环创建临时变量的场景可以使用AutoReleasePool.

OOM
App 包体积优化
Mach-O是什么
静态库和动态库有什么区别？
Link Map 能看什么？如何用它分析二进制体积和大符号？
+load +initalaze
    


  */
 
  // MARK: 事件处理
  onMemoBlur(id: string) {
    // 可扩展：保存到 localStorage 或后端
    const value = this.memoInputs()[id];
    if (value) {
      const memos = JSON.parse(localStorage.getItem('practice_list_memos') || '{}');
      memos[id] = value;
      localStorage.setItem('practice_list_memos', JSON.stringify(memos));
    }
  }
  /*
  
  */
  // MARK: 对比
  compareAnswer(item: PracticeItem) {
    const userAnswer = (this.memoInputs()[item.id] || '').trim().toLowerCase();
    const refAnswer = item.answer.trim().toLowerCase();
    if (!userAnswer) return;
    
    // 简单相似度计算
    const similarity = this.calcSimilarity(userAnswer, refAnswer);
    const percent = Math.round(similarity * 100);

    if (percent >= 80) {
      // MARK: 处理
      alert(`优秀！相似度 ${percent}%`);
    } else if (percent >= 50) {
      // MARK: 处理
      alert(`不错！相似度 ${percent}%，继续加油`);
    } else {
      // MARK: 处理
      alert(`相似度 ${percent}%，建议多看看答案`);
    }
  }

  // MARK: 计算
  // 简单字符相似度（Jaccard 系数）
  private calcSimilarity(a: string, b: string): number {
    const setA = new Set(a.split(''));
    const setB = new Set(b.split(''));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    if (union.size === 0) return 1;
    return intersection.size / union.size;
  }
}
