import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzGridModule } from 'ng-zorro-antd/grid';

import {
  PRACTICE_CATEGORY_LABELS,
  PRACTICE_CATEGORY_LIST,
  type PracticeCategory,
  type PracticeItem,
} from './practice.types';
import { parsePracticeFile } from './practice-import';
import { PracticeStorageService } from './practice-storage.service';

type FilterValue = PracticeCategory | 'all';

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzSelectModule,
    NzSpaceModule,
    NzTagModule,
    NzAlertModule,
    NzEmptyModule,
    NzStatisticModule,
    NzDividerModule,
    NzIconModule,
    NzGridModule,
    NzModalModule,
  ],
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

  readonly filteredItems = computed(() => {
    const all = this.items();
    const f = this.filterCategory();
    if (f === 'all') return all;
    return all.filter((i) => i.category === f);
  });

  readonly currentItem = computed(() => {
    const list = this.filteredItems();
    const idx = this.currentIndex();
    if (!list.length || idx < 0 || idx >= list.length) return null;
    return list[idx];
  });

  readonly statsTotal = computed(() => this.items().length);

  readonly statsByCategory = computed(() => this.storage.countByCategory(this.items()));

  filterOptions: { value: FilterValue; label: string }[] = [
    { value: 'all', label: '全部' },
    ...PRACTICE_CATEGORY_LIST.map((c) => ({ value: c, label: PRACTICE_CATEGORY_LABELS[c] })),
  ];

  categoryLabel(cat: PracticeCategory): string {
    return PRACTICE_CATEGORY_LABELS[cat];
  }

  ngOnInit(): void {
    this.reloadFromStorage();
  }

  setFilter(value: FilterValue): void {
    this.filterCategory.set(value);
    this.clampIndex();
    this.showAnswer.set(false);
  }

  randomOne(): void {
    const list = this.filteredItems();
    if (!list.length) {
      this.msg.warning('当前筛选下没有题目，请先导入或换一个分类。');
      return;
    }
    const idx = Math.floor(Math.random() * list.length);
    this.currentIndex.set(idx);
    this.showAnswer.set(false);
  }

  prev(): void {
    const list = this.filteredItems();
    if (!list.length) return;
    const next = (this.currentIndex() - 1 + list.length) % list.length;
    this.currentIndex.set(next);
    this.showAnswer.set(false);
  }

  next(): void {
    const list = this.filteredItems();
    if (!list.length) return;
    const next = (this.currentIndex() + 1) % list.length;
    this.currentIndex.set(next);
    this.showAnswer.set(false);
  }

  toggleAnswer(): void {
    this.showAnswer.update((v) => !v);
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
        this.showAnswer.set(false);
        this.msg.info('已清空题库。');
      },
    });
  }

  private reloadFromStorage(): void {
    this.items.set(this.storage.load());
    this.clampIndex();
  }

  private clampIndex(): void {
    const list = this.filteredItems();
    if (!list.length) {
      this.currentIndex.set(0);
      return;
    }
    if (this.currentIndex() >= list.length) {
      this.currentIndex.set(0);
    }
  }
}
