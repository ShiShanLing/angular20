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

  displayNo(item: PracticeItem): number {
    return this.displayNumbers().get(item.id) ?? 0;
  }

  questionNo(item: PracticeItem, index = 0): number {
    return this.reciteMode ? this.displayNo(item) : (item.no ?? index + 1);
  }

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
  

  private syncActiveIndexFromScroll(): void {
    const root = this.host.nativeElement as HTMLElement;
    const cards = [...root.querySelectorAll<HTMLElement>('.question-card')];
    if (cards.length === 0) return;
    const firstTop = cards[0].getBoundingClientRect().top;
    const lastTop = cards[cards.length - 1].getBoundingClientRect().top;
    if (cards.length > 1 && firstTop === lastTop) return;
    // 
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
  /*
  
@escaping:逃逸闭包,表明该闭包可能会在函数返回后调用.常用来做网络请求延迟返回调用.
@autoclosure:自动闭包,把一段代码包装成一个闭包,并且能当做参数传递.让代码看起来更加简洁.但是会因此实现细节,
Codable:是swift中用来做json和models质检的转换的协议,他其实包括了decode和encode,如果字段名称不一样使用codingkeys做映射,如果字段可选声明成optional.,更复杂的一些转换处理可以自定义init和decode.

Runtime消息派发机制:iOS中方法调用的过程其实就是消息派发的过程 调用方法其实就是使用objc_mesSend发送消息的过程.会先从方法缓存列表中寻找调用的方法,如果找不大就去实例方法列表中查找,如果还找不到就去类方法列表中查找.如果这些都找不到就会进入消息转发机制.
消息转发机制.
  
  */
  // MARK: 切换
  toggleAllAnswers() {
    if (this.allExpanded()) {
      // 全部隐藏答案
      this.revealedIds.set(new Set());
    } else {
      // 全部显示答案 + 展开
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
房价数据忘了看了.
KVC:简直编码,通过setValue forkey 和valueforkey读取属性值的一种方式,这种方式不直接调用属性,而是通过字符串.查找过程,是先查找setName setIsName等方法,如果找不到,在类允许的请求下再获取属性名字 name _name isName_isName,如果还获取不到就会执行setValue ForundfindKey方法.
KVO:键值观察,Runitme会生成一个被观察类的子类,然后把观察类的isa指向这个子类 并重新这个子类被观察属性的setting方法,在方法中执行willset 和 didset.这样在属性发生变化时就能出发willset和 didset.
iOS APNs通知的原理:iOS APNs 通知原理:App向苹果通知服务注册 dev token. 然后把 dev token通过接口交给服务端.服务端把需要通知的内容和dev token发送给苹果的通知服务,然后由 APNs 通过dev token 找到对应设备推送
Block类型，未捕获变量的BLock是全局block,捕获了普通局部变量的是栈block,捕获了成员变量的叫做堆block.执行了copy的block都是堆block.
Block为什么要使用copy:因为不使用copy的block属于栈block在回调后可能就会被释放掉,所以在需要延迟回调的block需要使用copy,copy到堆上.
Block的本质:BLock的本质是一个对象,它里面有isa flags invoke指针,descriptor,还有捕获的变量.
invoke指向block真正执行的函数实现,desscriptor保存的有block大小,copy/dispose辅助函数等信息.如果block捕获了变量,那么被不活的变量也会作为block的一部分保存.
@escaping:
@autoclosure
Codable
Runtime消息派发机制
Method Swizzling 的原理是什么？有哪些风险？
Class 和 Meta ClassCategory 和 Extension 有什么区别
离屏渲染
响应链
GCD

actor:
actor Isolation：
MainActor:
Sendable:
结构化并发和非结构化任务：
Task:
async/await:
runloop(一系列,常驻线程,timer不准确,和线程的管理):


@Sendable和普通闭包的区别
Weak为什么在对象释放后会变成nil，
循环引用
timer循环引用
可测试的网络层
依赖注入
Coordinator
模块化（分层，依赖， 跳转）：
模块化和组件化的区别：
如何避免模块之间循环依赖？App启动流程
App启动优化
大图加载卡顿降低内存峰值
新增——————————————— 明天背这些。
OOMApp 包体积优化
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
