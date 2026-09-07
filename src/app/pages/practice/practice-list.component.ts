import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
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
  PRACTICE_HISTORY_TRACK_SCOPES,
  PracticeStorageService,
  type PracticeHistoryTrack,
  type PracticeStorageScope,
} from './practice-storage.service';
import { builtinSeedForScope } from './practice-builtin-seed';
import { MarkdPipe } from './markd.pipe';

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
  template: `
    <div class="practice-list-page">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <h3 class="title">{{ pageTitle() }}</h3>
        <div class="toolbar-right">
          @if (!reciteMode && showCategoryTabs()) {
            <div class="category-tabs">
              @for (cat of filterCategories; track cat) {
                <button
                  nz-button
                  [nzType]="currentFilter() === cat ? 'primary' : 'default'"
                  nzSize="small"
                  (click)="setFilter(cat)"
                >
                  {{ getCategoryLabel(cat) }}
                </button>
              }
            </div>
          }
          <!-- 搜索框 -->
          <nz-input-wrapper nzSize="small" class="search-box">
            <span nzInputPrefix><span nz-icon nzType="search"></span></span>
            <input
              nz-input
              placeholder="搜索题目..."
              [ngModel]="searchText()"
              (ngModelChange)="searchText.set($event)"
            />
          </nz-input-wrapper>
        </div>
      </div>

      <!-- 统计 -->
      <div class="stats-bar">
        <span>共 <strong>{{ filteredItems().length }}</strong> 题@if (reciteMode && searchText().trim()) {（全库 {{ allItems().length }}）}</span>
        <span class="spacer"></span>
        @if (!reciteMode) {
          <button nz-button nzType="link" nzSize="small" (click)="toggleAllAnswers()">
            {{ allExpanded() ? '全部隐藏答案' : '全部显示答案' }}
          </button>
          <button nz-button nzType="link" nzSize="small" (click)="collapseAll()">
            全部折叠
          </button>
        }
      </div>

      <!-- 题目列表 -->
      <div class="question-list">
        @if (filteredItems().length === 0) {
          <nz-empty nzNotFoundContent="暂无题目"></nz-empty>
        }

        @for (item of filteredItems(); track item.id; let i = $index) {
          <div class="question-card" [class.expanded]="expandedIds().has(item.id)">
            <!-- 题目头部 -->
            <div class="question-header" (click)="toggleExpand(item.id)">
              <span class="question-index">{{ i + 1 }}</span>
              <nz-tag [nzColor]="getCategoryColor(item.category)" class="cat-tag">
                {{ getCategoryLabel(item.category) }}
              </nz-tag>
              <span class="question-text">{{ item.question }}</span>
              <span class="expand-icon">
                <span nz-icon [nzType]="expandedIds().has(item.id) ? 'up' : 'down'"></span>
              </span>
            </div>

            <!-- 展开区域：答案 + 手写框 -->
            @if (expandedIds().has(item.id)) {
              <div class="question-body">
                <div class="answer-section">
                  <div class="answer-label">
                    <span nz-icon nzType="bulb" nzTheme="outline"></span>
                    参考答案
                    @if (!reciteMode) {
                      <button nz-button nzType="link" nzSize="small" (click)="toggleAnswer(item.id); $event.stopPropagation()">
                        {{ revealedIds().has(item.id) ? '隐藏' : '显示' }}
                      </button>
                    }
                  </div>
                  @if (revealedIds().has(item.id)) {
                    @if (item.options?.length) {
                      <ul class="option-list">
                        @for (opt of item.options; track opt.id) {
                          <li [class.is-correct]="isCorrectOption(item, opt.id)">
                            {{ opt.id }}. {{ opt.text }}
                          </li>
                        }
                      </ul>
                    }
                    <div class="answer-content" [innerHTML]="(item.explanation || item.answer) | markd"></div>
                  } @else {
                    <div class="answer-hidden" (click)="toggleAnswer(item.id); $event.stopPropagation()">
                      点击显示答案
                    </div>
                  }
                </div>

                @if (!reciteMode) {
                  <div class="memo-section">
                    <div class="memo-label">
                      <span nz-icon nzType="edit" nzTheme="outline"></span>
                      手写记忆（填写答案或抄写一遍）
                    </div>
                    <textarea
                      nz-input
                      cdkTextareaAutosize [cdkAutosizeMinRows]="2" [cdkAutosizeMaxRows]="8"
                      placeholder="在这里默写答案，加深记忆..."
                      [ngModel]="memoInputs()[item.id]"
                      (ngModelChange)="setMemo(item.id, $event)"
                      (blur)="onMemoBlur(item.id)"
                    ></textarea>
                    @if (memoInputs()[item.id] && revealedIds().has(item.id)) {
                      <button nz-button nzType="link" nzSize="small" (click)="compareAnswer(item)">
                        对比答案
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .practice-list-page {
      padding: 16px;
      max-width: 900px;
      margin: 0 auto;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 12px;
    }

    .title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary, #262626);
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .category-tabs {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .search-box {
      width: 180px;
    }

    .stats-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-light, #f0f0f0);
      margin-bottom: 12px;
      font-size: 13px;
      color: var(--text-tertiary, #666);
    }

    .spacer { flex: 1; }

    .question-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .question-card {
      background: var(--card-bg, #fff);
      border: 1px solid var(--border-color, #e8e8e8);
      border-radius: 8px;
      overflow: hidden;
      transition: box-shadow 0.2s, border-color 0.2s;
    }

    .question-card:hover {
      box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.08));
    }

    .question-card.expanded {
      border-color: var(--accent-color, #1890ff);
    }

    .question-header {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px 16px;
      cursor: pointer;
      user-select: none;
    }

    .question-index {
      flex-shrink: 0;
      min-width: 28px;
      height: 28px;
      padding: 0 6px;
      background: var(--bg-tertiary, #f0f5ff);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--accent-color, #1890ff);
    }

    .cat-tag {
      flex-shrink: 0;
      margin-top: 4px;
    }

    .question-text {
      flex: 1;
      font-size: 14px;
      line-height: 1.6;
      padding-top: 2px;
      color: var(--text-primary, #262626);
    }

    .question-text :deep(p) {
      margin: 0;
    }

    .expand-icon {
      flex-shrink: 0;
      color: var(--text-tertiary, #999);
      padding-top: 4px;
    }

    .question-body {
      padding: 0 16px 16px 52px;
      border-top: 1px solid var(--border-light, #f5f5f5);
    }

    .answer-section {
      margin-top: 12px;
    }

    .answer-label, .memo-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary, #666);
      margin-bottom: 8px;
    }

    .answer-content {
      background: var(--bg-tertiary, #f6ffed);
      border: 1px solid var(--border-color, #b7eb8f);
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.8;
      color: var(--text-primary, #262626);
    }

    .answer-content :deep(pre) {
      background: var(--bg-tertiary, #f0f0f0);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }

    .answer-content :deep(code) {
      background: var(--bg-tertiary, #f0f0f0);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 13px;
    }

    .answer-hidden {
      background: var(--bg-tertiary, #fafafa);
      border: 1px dashed var(--border-color, #d9d9d9);
      border-radius: 6px;
      padding: 16px;
      text-align: center;
      color: var(--text-tertiary, #999);
      cursor: pointer;
      transition: all 0.2s;
    }

    .answer-hidden:hover {
      background: var(--bg-secondary, #f0f5ff);
      border-color: var(--accent-color, #1890ff);
      color: var(--accent-color, #1890ff);
    }

    .option-list {
      margin: 0 0 10px;
      padding-left: 18px;
      font-size: 14px;
      line-height: 1.7;
      color: var(--text-primary, #262626);
    }

    .option-list .is-correct {
      color: #389e0d;
      font-weight: 600;
    }

    .memo-section {
      margin-top: 16px;
    }

    .memo-section textarea {
      font-size: 13px;
    }

    @media (max-width: 768px) {
      .practice-list-page { padding: 12px; }
      .toolbar { flex-direction: column; align-items: flex-start; }
      .toolbar-right { width: 100%; }
      .search-box { width: 100%; }
      .question-body { padding-left: 16px; }
    }
  `  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storage = inject(PracticeStorageService);
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

  /** 展开的题目 ID 集合 */
  expandedIds = signal<Set<string>>(new Set());

  /** 显示答案的题目 ID 集合 */
  revealedIds = signal<Set<string>>(new Set());

  /** 手写记忆输入 */
  memoInputs = signal<Record<string, string>>({});

  /** 分类筛选选项 */
  readonly filterCategories: FilterValue[] = ['all', ...PRACTICE_CATEGORY_LIST];

  /** 筛选后的题目列表。背题一次列出该科目全库，只允许搜索，不按分类裁切。 */
  readonly filteredItems = computed(() => {
    let items = this.allItems();
    const filter = this.currentFilter();
    if (!this.reciteMode && filter !== 'all') {
      items = items.filter(i => i.category === filter);
    }
    const searchText = this.searchText();
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      items = items.filter(i =>
        i.question.toLowerCase().includes(kw) ||
        i.answer.toLowerCase().includes(kw) ||
        i.tags.toLowerCase().includes(kw)
      );
    }
    return items;
  });

  /** 是否全部展开 */
  readonly allExpanded = computed(() => {
    const items = this.filteredItems();
    if (items.length === 0) return false;
    return items.every(i => this.expandedIds().has(i.id));
  });

  // MARK: 初始化
  // 组件初始化：同步移动端断点、订阅视口变化与路由事件
  ngOnInit() {
    const scopes = this.scopesToLoad();
    this.ensureSeeds(scopes);
    this.allItems.set(this.loadItems(scopes));
  }

  private scopesToLoad(): PracticeStorageScope[] {
    if (this.reciteTrack) return PRACTICE_HISTORY_TRACK_SCOPES[this.reciteTrack];
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
    }
  }

  private loadItems(scopes: PracticeStorageScope[]): PracticeItem[] {
    const merged: PracticeItem[] = [];
    const seenIds = new Set<string>();
    const seenQuestions = new Set<string>();
    const pushUnique = (item: PracticeItem) => {
      const questionKey = `${item.category}::${item.question.trim()}`;
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
    if (track === 'ios' || track === 'android' || track === 'angular' || track === 'ts' || track === 'agent') {
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
  }

  // MARK: 切换
  toggleExpand(id: string) {
    if (this.expandedIds().has(id)) {
      this.expandedIds.set(new Set());
      this.revealedIds.set(new Set());
      return;
    }
    this.expandedIds.set(new Set([id]));
    this.revealedIds.set(this.reciteMode ? new Set([id]) : new Set());
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
