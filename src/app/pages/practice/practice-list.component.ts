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
  template: `
    <div class="practice-list-page">
      <div class="list-head" [class.list-head-sticky]="reciteMode">
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
                [placeholder]="searchPlaceholder()"
                [ngModel]="searchText()"
                (ngModelChange)="onSearchChange($event)"
              />
            </nz-input-wrapper>
            @if (reciteMode) {
              <button
                nz-button
                nzSize="small"
                [nzType]="addQuestionOpen() ? 'primary' : 'default'"
                (click)="toggleAddQuestion()"
              >
                添加题目
              </button>
              <button
                nz-button
                nzSize="small"
                [nzType]="starredOnly() ? 'primary' : 'default'"
                [disabled]="!starredCount() && !starredOnly()"
                (click)="toggleStarredOnly()"
                title="只看已标星的易忘题"
              >
                <span nz-icon nzType="star" [nzTheme]="starredOnly() ? 'fill' : 'outline'"></span>
                <span class="star-filter-text">仅看标星</span>{{ starredCount() ? ' ' + starredCount() : '' }}
              </button>
            }
          </div>
        </div>

        @if (reciteMode && addQuestionOpen()) {
          <div class="add-question-panel">
            <label class="add-question-label">
              题目
              <textarea
                nz-input
                [ngModel]="newQuestionText()"
                (ngModelChange)="newQuestionText.set($event)"
                placeholder="新题的题干"
              ></textarea>
            </label>
            <label class="add-question-label">
              答案
              <textarea
                nz-input
                [ngModel]="newAnswerText()"
                (ngModelChange)="newAnswerText.set($event)"
                placeholder="参考答案"
              ></textarea>
            </label>
            <div class="add-question-place">
              <label>
                插到第
                <input
                  nz-input
                  type="number"
                  min="1"
                  step="1"
                  [ngModel]="newQuestionPlace()"
                  (ngModelChange)="onNewQuestionPlace($event)"
                />
                题前面
              </label>
              <label>
                排序值
                <input
                  nz-input
                  type="number"
                  step="any"
                  [ngModel]="newQuestionSort()"
                  (ngModelChange)="onNewQuestionSort($event)"
                />
              </label>
            </div>
            <p class="add-question-hint">
              页面上的 1、2、3 只是排好序后的序号。排序值才是真实顺序，可以填 49.5。插在现在的第 50 题前面时，排序值会变成 49.5，保存后它显示成 50，原来的 50 显示成 51。
            </p>
            <div class="add-question-actions">
              <button nz-button nzType="primary" nzSize="small" [disabled]="addingQuestion()" (click)="submitNewQuestion()">
                {{ addingQuestion() ? '提交中' : '添加到服务器' }}
              </button>
              <button nz-button nzSize="small" (click)="questionFileInput.click()">上传 JSON</button>
              <input
                #questionFileInput
                type="file"
                accept="application/json,.json"
                hidden
                (change)="onQuestionFile($event)"
              />
            </div>
            <p class="add-question-hint">JSON 文件是数组。每题包含 question、answer，sort 可以写成 49.5。带了已有 id 的题会跳过，避免盖掉线上改过的答案。</p>
            @if (addQuestionStatus()) {
              <div class="answer-editor-status">{{ addQuestionStatus() }}</div>
            }
          </div>
        }

        @if (!reciteMode) {
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
        }
      </div>

      @if (reciteMode && indexTicks().length > 1) {
        <nav
          class="index-rail"
          aria-label="题号快捷跳转"
          (pointerdown)="onIndexPointerDown($event)"
          (pointermove)="onIndexPointerMove($event)"
          (pointerup)="onIndexPointerEnd()"
          (pointercancel)="onIndexPointerEnd()"
        >
          @if (indexHintTick() !== null) {
            <div class="index-hint" [style.top.px]="indexHintTop()" aria-hidden="true">
              {{ indexHintTick() }}
            </div>
          }
          @for (tick of indexTicks(); track tick) {
            <button
              type="button"
              class="index-tick"
              [class.is-active]="activeIndexTick() === tick"
              [attr.aria-label]="'跳到第 ' + tick + ' 题附近'"
              (click)="jumpToIndexTick(tick); $event.stopPropagation()"
            >
              {{ tick }}
            </button>
          }
        </nav>
      }

      <!-- 题目列表 -->
      <div class="question-list">
        @if (filteredItems().length === 0) {
          <nz-empty
            [nzNotFoundContent]="reciteMode && starredOnly() ? '还没有标星题' : '暂无题目'"
          ></nz-empty>
        }

        @for (item of filteredItems(); track item.id; let i = $index) {
          <div
            class="question-card"
            [class.expanded]="expandedIds().has(item.id)"
            [class.has-star]="reciteMode"
            [attr.data-question-id]="item.id"
            [attr.data-question-no]="displayNo(item)"
          >
            @if (reciteMode) {
              <button
                type="button"
                class="star-btn"
                [class.is-starred]="isStarred(item.id)"
                [attr.aria-label]="isStarred(item.id) ? '取消标星' : '标星'"
                [attr.title]="isStarred(item.id) ? '取消标星' : '标为易忘题'"
                (click)="toggleStar(item.id, $event)"
              >
                <span nz-icon nzType="star" [nzTheme]="isStarred(item.id) ? 'fill' : 'outline'"></span>
              </button>
            }
            <!-- 题目头部 -->
            <div class="question-header" (click)="toggleExpand(item.id)">
              <span class="question-index">{{ reciteMode ? displayNo(item) : (item.no ?? i + 1) }}</span>
              @if (!reciteMode) {
                <nz-tag [nzColor]="getCategoryColor(item.category)" class="cat-tag">
                  {{ getCategoryLabel(item.category) }}
                </nz-tag>
              }
              <span class="question-text">{{ item.question }}</span>
              @if (reciteMode) {
                <button
                  type="button"
                  class="copy-btn"
                  [class.is-copied]="copiedKey() === item.id + ':q'"
                  aria-label="复制题目"
                  [attr.title]="copiedKey() === item.id + ':q' ? '已复制题目' : '复制题目'"
                  (click)="copyText(item.question, item.id + ':q', $event)"
                >
                  <span nz-icon [nzType]="copiedKey() === item.id + ':q' ? 'check-circle' : 'copy'" [nzTheme]="copiedKey() === item.id + ':q' ? 'fill' : 'outline'"></span>
                </button>
              }
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
                    @if (reciteMode && revealedIds().has(item.id)) {
                      <span class="answer-label-actions">
                      <button
                        type="button"
                        class="copy-btn"
                        aria-label="编辑答案"
                        title="编辑答案"
                        (click)="startAnswerEdit(item, $event)"
                      >
                        <span nz-icon nzType="edit" nzTheme="outline"></span>
                      </button>
                      <button
                        type="button"
                        class="copy-btn"
                        [class.is-copied]="copiedKey() === item.id + ':a'"
                        aria-label="复制答案"
                        [attr.title]="copiedKey() === item.id + ':a' ? '已复制答案' : '复制答案'"
                        (click)="copyText(item.explanation || item.answer, item.id + ':a', $event)"
                      >
                        <span nz-icon [nzType]="copiedKey() === item.id + ':a' ? 'check-circle' : 'copy'" [nzTheme]="copiedKey() === item.id + ':a' ? 'fill' : 'outline'"></span>
                      </button>
                      </span>
                    }
                    @if (!reciteMode) {
                      <button nz-button nzType="link" nzSize="small" (click)="toggleAnswer(item.id); $event.stopPropagation()">
                        {{ revealedIds().has(item.id) ? '隐藏' : '显示' }}
                      </button>
                    }
                  </div>
                  @if (revealedIds().has(item.id) && editingAnswerId() === item.id) {
                    <div class="answer-editor">
                      <label class="answer-editor-label">
                        题目
                        <textarea
                          nz-input
                          [ngModel]="editQuestionDraft()"
                          (ngModelChange)="editQuestionDraft.set($event)"
                        ></textarea>
                      </label>
                      <label class="answer-editor-label">
                        答案
                        <textarea
                          nz-input
                          [ngModel]="editAnswerDraft()"
                          (ngModelChange)="editAnswerDraft.set($event)"
                        ></textarea>
                      </label>
                      <div class="answer-editor-actions">
                        <button nz-button nzType="primary" nzSize="small" [disabled]="answerSaving()" (click)="saveAnswerEdit(item)">
                          {{ answerSaving() ? '提交中' : '提交到服务器' }}
                        </button>
                        <button nz-button nzSize="small" (click)="cancelAnswerEdit()">取消</button>
                        <button nz-button nzType="link" nzSize="small" (click)="restoreOriginalAnswer(item)">恢复原答案</button>
                      </div>
                    </div>
                  } @else if (revealedIds().has(item.id)) {
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
                    @if (answerStatusId() === item.id && answerStatus()) {
                      <div class="answer-editor-status">{{ answerStatus() }}</div>
                    }
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
      --page-pad: 16px;
      --index-rail-width: 28px;
      padding: var(--page-pad);
      max-width: 900px;
      margin: 0 auto;
    }

    .practice-list-page:has(.index-rail) {
      padding-right: calc(var(--page-pad) + var(--index-rail-width));
    }

    .index-rail {
      position: fixed;
      right: max(2px, env(safe-area-inset-right));
      top: 50%;
      transform: translateY(-50%);
      z-index: 9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: 6px 0;
      max-height: min(70vh, 520px);
      overflow: visible;
      user-select: none;
      touch-action: none;
      -webkit-tap-highlight-color: transparent;
    }

    .index-hint {
      position: absolute;
      right: calc(100% + 10px);
      transform: translateY(-50%);
      min-width: 56px;
      height: 56px;
      padding: 0 8px;
      border-radius: 12px;
      background: #1a1a1a;
      color: #fff;
      font-size: 28px;
      font-weight: 700;
      line-height: 56px;
      text-align: center;
      pointer-events: none;
      z-index: 2;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
    }

    .index-tick {
      margin: 0;
      padding: 0;
      min-width: var(--index-rail-width);
      border: none;
      background: transparent;
      color: var(--accent-color, #1890ff);
      font-size: 10px;
      line-height: 1.35;
      font-weight: 600;
      cursor: pointer;
    }

    .index-tick.is-active {
      color: var(--text-primary, #262626);
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

    .list-head-sticky {
      // 抵消内容区内边距，让背题栏贴住站点头部，题目不能从空隙透出
      --head-shift: calc(var(--app-content-pad, 24px) + var(--page-pad));
      position: sticky;
      top: 0;
      z-index: 8;
      margin-top: calc(-1 * var(--head-shift));
      padding-top: var(--head-shift);
      padding-bottom: 8px;
      background: var(--bg-primary, #f5f5f5);
    }

    .list-head-sticky .stats-bar {
      margin-bottom: 0;
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
      position: relative;
      background: var(--card-bg, #fff);
      border: 1px solid var(--border-color, #e8e8e8);
      border-radius: 8px;
      overflow: hidden;
      transition: box-shadow 0.2s, border-color 0.2s;
    }

    .question-card.has-star .question-header {
      padding-left: 36px;
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
      min-width: 32px;
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

    .star-btn {
      position: absolute !important;
      top: 0;
      left: 0;
      z-index: 2;
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      border-radius: 0 0 8px 0;
      background: rgba(250, 173, 20, 0.12);
      color: #d4b106;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      line-height: 1;
      transition: color 0.15s, background 0.15s;
    }

    .star-btn:hover {
      color: #faad14;
      background: rgba(250, 173, 20, 0.08);
    }

    .star-btn.is-starred {
      color: #faad14;
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

    .copy-btn {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      margin-top: 2px;
      padding: 0;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--text-tertiary, #8c8c8c);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    }

    .copy-btn:hover,
    .copy-btn.is-copied {
      color: var(--accent-color, #1677ff);
      background: rgba(22, 119, 255, 0.08);
    }

    .answer-label-actions {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
    }

    .copy-btn-end {
      margin-left: auto;
      margin-top: 0;
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

    .answer-editor {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .answer-editor-label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary, #666);
    }

    .answer-editor textarea {
      width: 100%;
      min-height: 120px;
      font-size: 14px;
      line-height: 1.7;
    }

    .answer-editor-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .answer-editor-status {
      margin-top: 8px;
      font-size: 12px;
      color: var(--text-tertiary, #8c8c8c);
    }

    .add-question-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
      padding: 12px;
      border: 1px solid var(--border-color, #f0f0f0);
      border-radius: 8px;
      background: var(--bg-secondary, #fafafa);
    }

    .add-question-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
      color: var(--text-secondary, #666);
    }

    .add-question-label textarea {
      width: 100%;
      min-height: 72px;
    }

    .add-question-place {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      font-size: 13px;
      color: var(--text-secondary, #666);
    }

    .add-question-place input {
      width: 96px;
      margin: 0 6px;
    }

    .add-question-hint {
      margin: 0;
      font-size: 12px;
      line-height: 1.6;
      color: var(--text-tertiary, #8c8c8c);
    }

    .add-question-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
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
      .practice-list-page { --page-pad: 5px; }
      .toolbar {
        flex-wrap: nowrap;
        gap: 6px;
        margin-bottom: 0;
      }
      .title {
        flex: 0 0 auto;
        font-size: 15px;
        white-space: nowrap;
      }
      .toolbar-right {
        flex: 1;
        min-width: 0;
        flex-wrap: nowrap;
        gap: 4px;
      }
      .search-box {
        flex: 1;
        min-width: 0;
        width: auto;
      }
      .star-filter-text { display: none; }
      .list-head-sticky {
        padding-top: 5px;
        padding-bottom: 5px;
      }
      .stats-bar {
        padding: 5px 0;
        margin-bottom: 5px;
        font-size: 12px;
      }
      .question-list { gap: 5px; }
      .question-body { padding-left: 16px; }
      .index-tick { font-size: 9px; line-height: 1.25; }
    }
  `  ],
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
    if (this.reciteMode) {
      this.jumpToFirstMatchedQuestion();
    }
  }

  // MARK: 搜索
  onSearchChange(value: string): void {
    this.searchText.set(value);
    if (this.reciteMode) {
      this.jumpToFirstMatchedQuestion();
    }
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
    const frameGap = 8;
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

  private jumpToFirstMatchedQuestion(): void {
    const query = this.searchText().trim();
    if (!query) return;
    const first = this.searchResults()[0];
    if (!first) return;
    this.expandQuestion(first.id);
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

  /** 列表滚动时，高亮当前贴在顶栏下方的那一档题号。 */
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
