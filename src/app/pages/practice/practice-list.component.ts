import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

import {
  PRACTICE_CATEGORY_LABELS,
  PRACTICE_CATEGORY_LIST,
  type PracticeCategory,
  type PracticeFilterCategory,
  type PracticeItem,
} from './practice.types';
import {
  PracticeStorageService,
  type PracticeStorageScope,
} from './practice-storage.service';
import { angularJobSeedToPracticeItems, iosJobSeedToPracticeItems, iosSeedToPracticeItems } from './ios-seed';
import { MarkdPipe } from './markd.pipe';

type FilterValue = PracticeFilterCategory;

/**
 * 列表刷题页：所有题目纵向平铺，答案默认隐藏，点击展开，支持手写答案记忆。
 */
@Component({
  selector: 'app-practice-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzEmptyModule,
    NzBadgeModule,
    MarkdPipe,
  ],
  template: `
    <div class="practice-list-page">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <h3 class="title">{{ pageTitle }}</h3>
        <div class="toolbar-right">
          <!-- 分类筛选 -->
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
          <!-- 搜索框 -->
          <nz-input-group [nzPrefix]="searchIcon" nzSize="small" class="search-box">
            <input
              nz-input
              placeholder="搜索题目..."
              [(ngModel)]="searchText"
              (ngModelChange)="onSearchChange()"
            />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search"></span>
          </ng-template>
        </div>
      </div>

      <!-- 统计 -->
      <div class="stats-bar">
        <span>共 <strong>{{ filteredItems().length }}</strong> 题</span>
        <span class="spacer"></span>
        <button nz-button nzType="link" nzSize="small" (click)="toggleAllAnswers()">
          {{ allExpanded() ? '全部隐藏答案' : '全部显示答案' }}
        </button>
        <button nz-button nzType="link" nzSize="small" (click)="collapseAll()">
          全部折叠
        </button>
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
              <span class="question-text" [innerHTML]="item.question | markd"></span>
              <span class="expand-icon">
                <span nz-icon [nzType]="expandedIds().has(item.id) ? 'up' : 'down'"></span>
              </span>
            </div>

            <!-- 展开区域：答案 + 手写框 -->
            @if (expandedIds().has(item.id)) {
              <div class="question-body">
                <!-- 答案区域 -->
                <div class="answer-section">
                  <div class="answer-label">
                    <span nz-icon nzType="bulb" nzTheme="outline"></span>
                    参考答案
                    <button nz-button nzType="link" nzSize="small" (click)="toggleAnswer(item.id); $event.stopPropagation()">
                      {{ revealedIds().has(item.id) ? '隐藏' : '显示' }}
                    </button>
                  </div>
                  @if (revealedIds().has(item.id)) {
                    <div class="answer-content" [innerHTML]="item.answer | markd"></div>
                  } @else {
                    <div class="answer-hidden" (click)="toggleAnswer(item.id); $event.stopPropagation()">
                      点击显示答案
                    </div>
                  }
                </div>

                <!-- 手写记忆框 -->
                <div class="memo-section">
                  <div class="memo-label">
                    <span nz-icon nzType="edit" nzTheme="outline"></span>
                    手写记忆（填写答案或抄写一遍）
                  </div>
                  <textarea
                    nz-input
                    [nzAutosize]="{ minRows: 2, maxRows: 8 }"
                    placeholder="在这里默写答案，加深记忆..."
                    [(ngModel)]="memoInputs[item.id]"
                    (blur)="onMemoBlur(item.id)"
                  ></textarea>
                  @if (memoInputs[item.id] && revealedIds().has(item.id)) {
                    <button nz-button nzType="link" nzSize="small" (click)="compareAnswer(item)">
                      对比答案
                    </button>
                  }
                </div>
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
      border-color: #1890ff;
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
      width: 28px;
      height: 28px;
      background: var(--bg-tertiary, #f0f5ff);
      border-radius: 50%;
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
  `],
})
export class PracticeListComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly storage = inject(PracticeStorageService);

  readonly pageName = '列表刷题';

  /** 题库原始数据 */
  allItems = signal<PracticeItem[]>([]);

  /** 当前分类筛选 */
  currentFilter = signal<FilterValue>('all');

  /** 搜索文本 */
  searchText = '';

  /** 展开的题目 ID 集合 */
  expandedIds = signal<Set<string>>(new Set());

  /** 显示答案的题目 ID 集合 */
  revealedIds = signal<Set<string>>(new Set());

  /** 手写记忆输入 */
  memoInputs: Record<string, string> = {};

  /** 分类筛选选项 */
  readonly filterCategories: FilterValue[] = ['all', ...PRACTICE_CATEGORY_LIST];

  /** storage scope（与 practice/ios-learning/angular-learning 对应）
   *  已废弃：现在合并加载所有题库，保留字段仅为类型兼容 */
  private scope: PracticeStorageScope = 'practice';

  /** 筛选后的题目列表 */
  readonly filteredItems = computed(() => {
    let items = this.allItems();
    const filter = this.currentFilter();
    if (filter !== 'all') {
      items = items.filter(i => i.category === filter);
    }
    if (this.searchText.trim()) {
      const kw = this.searchText.trim().toLowerCase();
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

  ngOnInit() {
    // 先确保所有内置题库已注入 localStorage
    this.ensureAllSeeds();

    // 合并所有题库（practice + ios-learning + angular-learning）
    const allScopes: PracticeStorageScope[] = ['practice', 'ios-learning', 'angular-learning'];
    const merged: PracticeItem[] = [];
    const seenIds = new Set<string>();
    for (const scope of allScopes) {
      const items = this.storage.load(scope);
      for (const item of items) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          merged.push(item);
        }
      }
    }
    this.allItems.set(merged);
  }

  /** 确保所有内置题库已注入（首次访问时自动初始化） */
  private ensureAllSeeds(): void {
    const now = Date.now();
    const scopes: Array<{ scope: PracticeStorageScope; seed: (t: number) => PracticeItem[] }> = [
      { scope: 'practice', seed: iosSeedToPracticeItems },
      { scope: 'ios-learning', seed: iosJobSeedToPracticeItems },
      { scope: 'angular-learning', seed: angularJobSeedToPracticeItems },
    ];
    for (const { scope, seed } of scopes) {
      const existing = this.storage.load(scope);
      if (existing.length === 0) {
        this.storage.save(seed(now), scope);
      } else {
        this.storage.mergeItems(seed(now), scope);
      }
    }
  }

  ngOnDestroy() {}

  get pageTitle(): string {
    return '列表刷题';
  }

  getCategoryLabel(cat: FilterValue): string {
    if (cat === 'all') return '全部';
    return PRACTICE_CATEGORY_LABELS[cat] || cat;
  }

  getCategoryColor(cat: PracticeCategory): string {
    const colors: Record<string, string> = {
      ios: 'blue',
      angular: 'red',
      android: 'green',
      'angular-ts': 'orange',
      'angular-js': 'cyan',
      'angular-css': 'purple',
    };
    return colors[cat] || 'default';
  }

  setFilter(cat: FilterValue) {
    this.currentFilter.set(cat);
  }

  onSearchChange() {
    // 触发 computed 重新计算
  }

  toggleExpand(id: string) {
    const set = this.expandedIds();
    if (set.has(id)) {
      // 点击已展开的，关闭它
      this.expandedIds.set(new Set());
      this.revealedIds.set(new Set());
    } else {
      // 手风琴模式：只展开当前这个，关闭其他
      this.expandedIds.set(new Set([id]));
      this.revealedIds.set(new Set());
    }
  }

  toggleAnswer(id: string) {
    const set = new Set(this.revealedIds());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.revealedIds.set(set);
  }

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

  collapseAll() {
    this.expandedIds.set(new Set());
    this.revealedIds.set(new Set());
  }

  onMemoBlur(id: string) {
    // 可扩展：保存到 localStorage 或后端
    const value = this.memoInputs[id];
    if (value) {
      const memos = JSON.parse(localStorage.getItem('practice_list_memos') || '{}');
      memos[id] = value;
      localStorage.setItem('practice_list_memos', JSON.stringify(memos));
    }
  }

  compareAnswer(item: PracticeItem) {
    const userAnswer = (this.memoInputs[item.id] || '').trim().toLowerCase();
    const refAnswer = item.answer.trim().toLowerCase();
    if (!userAnswer) return;

    // 简单相似度计算
    const similarity = this.calcSimilarity(userAnswer, refAnswer);
    const percent = Math.round(similarity * 100);

    if (percent >= 80) {
      alert(`优秀！相似度 ${percent}%`);
    } else if (percent >= 50) {
      alert(`不错！相似度 ${percent}%，继续加油`);
    } else {
      alert(`相似度 ${percent}%，建议多看看答案`);
    }
  }

  /** 简单字符相似度（Jaccard 系数） */
  private calcSimilarity(a: string, b: string): number {
    const setA = new Set(a.split(''));
    const setB = new Set(b.split(''));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    if (union.size === 0) return 1;
    return intersection.size / union.size;
  }
}
