import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

import { QuillModule } from 'ngx-quill';
import Quill from 'quill';

import { NoteService, Notebook, Note } from '../../services/note.service';

type SidebarFilter = 'all' | 'favorite' | { notebookId: number } | { tag: string };

// Register custom font size attributor for pt values
const SizeStyle = Quill.import('attributors/style/size') as any;
SizeStyle.whitelist = ['9pt','10pt','11pt','12pt','14pt','16pt','18pt','20pt','22pt','24pt','28pt','32pt','36pt','48pt','72pt'];
Quill.register(SizeStyle, true);

// Register table module
const Table = Quill.import('modules/table');

@Component({
  selector: 'app-tools-notes',
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzInputModule,
    NzModalModule, NzTagModule, NzTooltipModule, NzPopconfirmModule,
    NzEmptyModule, NzSelectModule, NzInputNumberModule, QuillModule,
  ],
  templateUrl: './tools-notes.component.html',
  styleUrl: './tools-notes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolsNotesComponent implements OnInit, OnDestroy {
  private readonly quillEditorRef = viewChild<any>('quillEditor');

  // Sidebar
  readonly notebooks = signal<Notebook[]>([]);
  readonly sidebarFilter = signal<SidebarFilter>('all');
  readonly allTags = signal<string[]>([]);

  // Note list
  readonly notes = signal<Note[]>([]);
  readonly selectedNoteId = signal<number | null>(null);
  readonly searchQuery = signal('');
  private searchSubject = new Subject<string>();

  // Editor
  readonly editTitle = signal('');
  readonly editTags = signal<string[]>([]);
  readonly newTag = signal('');
  readonly isDirty = signal(false);
  private autoSaveSubject = new Subject<void>();
  private quillInstance: any = null;
  readonly editorContent = signal('');

  // Quill editor options
  editorModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ['9pt','10pt','11pt','12pt','14pt','16pt','18pt','20pt','22pt','24pt','28pt','32pt','36pt','48pt','72pt'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        [{ align: [] }],
        ['clean'],
      ],
    },
    table: true,
  };

  editorFormats = [
    'header', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'indent', 'align',
    'blockquote', 'code-block', 'link', 'image', 'table',
  ];

  private readonly noteService = inject(NoteService);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // MARK: 初始化
  // 组件初始化：同步移动端断点、订阅视口变化与路由事件
  ngOnInit(): void {
    this.loadNotebooks();
    this.loadNotes();

    this.searchSubject.pipe(debounceTime(400)).subscribe(() => {
      this.loadNotes();
    });

    this.autoSaveSubject.pipe(debounceTime(1500)).subscribe(() => {
      this.saveCurrentNote();
    });
  }

  // MARK: 销毁清理
  // 取消全部订阅，避免内存泄漏
  ngOnDestroy(): void {
    this.searchSubject.complete();
    this.autoSaveSubject.complete();
    if (this.isDirty() && this.selectedNoteId()) {
      this.saveCurrentNote();
    }
  }

  // MARK: 插入表格
  insertTable(): void {
    this.tableRows.set(3);
    this.tableCols.set(3);
    this.showTableModal.set(true);
  }

  // MARK: 确认
  confirmInsertTable(): void {
    if (!this.quillInstance) return;
    const table = this.quillInstance.getModule('table');
    if (table) {
      table.insertTable(this.tableRows(), this.tableCols());
    }
    this.showTableModal.set(false);
  }

  // MARK: 事件处理
  onEditorCreated(editor: any): void {
    this.quillInstance = editor;
  }

  // MARK: 事件处理
  onContentChanged(): void {
    this.isDirty.set(true);
    this.autoSaveSubject.next();
  }

  // Table insert state
  readonly showTableModal = signal(false);
  readonly tableRows = signal(3);
  readonly tableCols = signal(3);

  // === Sidebar ===

  // MARK: 加载
  loadNotebooks(): void {
    this.noteService.getNotebooks().subscribe(nbs => {
      this.notebooks.set(nbs);
    });
  }

  // MARK: 创建
  createNotebook(): void {
    this.modal.confirm({
      nzTitle: '新建文件夹',
      nzContent: '<input id="nb-name-input" class="ant-input" placeholder="文件夹名称" autofocus />',
      nzOnOk: () => {
        const input = document.getElementById('nb-name-input') as HTMLInputElement;
        const name = input?.value?.trim();
        if (!name) return;
        this.noteService.createNotebook(name).subscribe(() => {
          this.loadNotebooks();
          this.msg.success('文件夹已创建');
        });
      },
    });
  }

  // MARK: 重命名本
  renameNotebook(nb: Notebook, event: Event): void {
    event.stopPropagation();
    this.modal.confirm({
      nzTitle: '重命名文件夹',
      nzContent: `<input id="nb-name-input" class="ant-input" value="${nb.name}" autofocus />`,
      nzOnOk: () => {
        const input = document.getElementById('nb-name-input') as HTMLInputElement;
        const name = input?.value?.trim();
        if (!name) return;
        this.noteService.renameNotebook(nb.id, name).subscribe(() => {
          this.loadNotebooks();
        });
      },
    });
  }

  // MARK: 删除
  deleteNotebook(nb: Notebook, event: Event): void {
    event.stopPropagation();
    this.modal.confirm({
      nzTitle: `删除文件夹「${nb.name}」？`,
      nzContent: '文件夹中的笔记将移至"未分类"',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.noteService.deleteNotebook(nb.id).subscribe(() => {
          this.loadNotebooks();
          if (this.isNotebookSelected(nb.id)) {
            this.sidebarFilter.set('all');
            this.loadNotes();
          }
          this.msg.success('文件夹已删除');
        });
      },
    });
  }

  // MARK: 选择
  selectSidebar(filter: SidebarFilter): void {
    this.sidebarFilter.set(filter);
    this.loadNotes();
  }

  // MARK: 判断
  isFilterActive(filter: SidebarFilter): boolean {
    const current = this.sidebarFilter();
    if (filter === 'all' && current === 'all') return true;
    if (filter === 'favorite' && current === 'favorite') return true;
    if (typeof filter === 'object' && typeof current === 'object') {
      return JSON.stringify(filter) === JSON.stringify(current);
    }
    return false;
  }

  // MARK: 判断
  isNotebookSelected(id: number): boolean {
    const current = this.sidebarFilter();
    return typeof current === 'object' && 'notebookId' in current && current.notebookId === id;
  }

  // === Notes List ===

  // MARK: 加载笔记
  loadNotes(): void {
    const params: any = {};
    const filter = this.sidebarFilter();
    if (filter === 'favorite') {
      params.isFavorite = true;
    } else if (typeof filter === 'object') {
      if ('notebookId' in filter) params.notebookId = filter.notebookId;
      if ('tag' in filter) params.tag = filter.tag;
    }
    if (this.searchQuery()) params.search = this.searchQuery();

    this.noteService.getNotes(params).subscribe(notes => {
      this.notes.set(notes);
      this.extractAllTags();
    });
  }

  // MARK: 事件处理
  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  // MARK: 选择
  selectNote(note: Note): void {
    if (this.isDirty() && this.selectedNoteId()) {
      this.saveCurrentNote();
    }
    this.selectedNoteId.set(note.id);
    this.editTitle.set(note.title);
    this.editTags.set([...(note.tags || [])]);
    this.editorContent.set(note.content || '');
    this.isDirty.set(false);

    // Load content into existing editor instance
    if (this.quillInstance) {
      this.quillInstance.root.innerHTML = note.content || '';
    }
  }

  // MARK: 判断
  isSelected(note: Note): boolean {
    return this.selectedNoteId() === note.id;
  }

  // MARK: 创建
  createNote(): void {
    let notebookId: number | null = null;
    const filter = this.sidebarFilter();
    if (typeof filter === 'object' && 'notebookId' in filter) {
      notebookId = filter.notebookId;
    }
    this.noteService.createNote('无标题', '', notebookId).subscribe(note => {
      this.loadNotes();
      this.selectNote(note);
    });
  }

  // MARK: 删除笔记
  deleteNote(note: Note, event: Event): void {
    event.stopPropagation();
    this.modal.confirm({
      nzTitle: `删除笔记「${note.title}」？`,
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.noteService.deleteNote(note.id).subscribe(() => {
          if (this.selectedNoteId() === note.id) {
            this.selectedNoteId.set(null);
            this.editTitle.set('');
            this.editTags.set([]);
          }
          this.loadNotes();
          this.msg.success('笔记已删除');
        });
      },
    });
  }

  // MARK: 切换
  togglePin(note: Note, event: Event): void {
    event.stopPropagation();
    this.noteService.updateNote(note.id, { isPinned: !note.isPinned }).subscribe(updated => {
      note.isPinned = updated.isPinned;
      this.notes.update(list => [...list]);
    });
  }

  // MARK: 切换
  toggleFavorite(note: Note, event: Event): void {
    event.stopPropagation();
    this.noteService.updateNote(note.id, { isFavorite: !note.isFavorite }).subscribe(updated => {
      note.isFavorite = updated.isFavorite;
      this.notes.update(list => [...list]);
    });
  }

  // MARK: 获取
  getNoteSummary(note: Note): string {
    const div = document.createElement('div');
    div.innerHTML = note.content || '';
    const text = div.textContent?.trim() || '';
    return text.substring(0, 60) || '暂无内容';
  }

  // MARK: 获取
  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
  }

  // === Editor ===

  // MARK: 获取
  private getEditorContent(): string {
    if (!this.quillInstance) return '';
    return this.quillInstance.root.innerHTML;
  }

  // MARK: 事件处理
  onTitleChange(value: string): void {
    this.editTitle.set(value);
    this.isDirty.set(true);
    this.autoSaveSubject.next();
  }

  // MARK: 保存
  saveCurrentNote(): void {
    const selectedNoteId = this.selectedNoteId();
    if (!selectedNoteId || !this.isDirty()) return;
    this.noteService.updateNote(selectedNoteId, {
      title: this.editTitle(),
      content: this.getEditorContent(),
      tags: this.editTags(),
    }).subscribe(() => {
      this.isDirty.set(false);
      this.loadNotes();
    });
  }

  readonly currentNotePinned = computed(() => {
    const note = this.notes().find(n => n.id === this.selectedNoteId());
    return note?.isPinned || false;
  });

  // MARK: 切换
  togglePinCurrent(): void {
    const selectedNoteId = this.selectedNoteId();
    if (!selectedNoteId) return;
    const note = this.notes().find(n => n.id === selectedNoteId);
    if (!note) return;
    this.noteService.updateNote(note.id, { isPinned: !note.isPinned }).subscribe(updated => {
      note.isPinned = updated.isPinned;
      this.notes.update(list => [...list]);
    });
  }

  // === Tags ===

  // MARK: 添加
  addTag(): void {
    const tag = this.newTag().trim();
    if (tag && !this.editTags().includes(tag)) {
      this.editTags.update(tags => [...tags, tag]);
      this.isDirty.set(true);
      this.autoSaveSubject.next();
    }
    this.newTag.set('');
  }

  // MARK: 移除
  removeTag(tag: string): void {
    this.editTags.update(tags => tags.filter(t => t !== tag));
    this.isDirty.set(true);
    this.autoSaveSubject.next();
  }

  // MARK: 过滤
  filterByTag(tag: string): void {
    this.sidebarFilter.set({ tag });
    this.loadNotes();
  }

  // MARK: 提取标签
  private extractAllTags(): void {
    const tagSet = new Set<string>();
    this.notes().forEach(n => n.tags?.forEach(t => tagSet.add(t)));
    this.allTags.set(Array.from(tagSet).sort());
  }

  // === Export ===

  // MARK: 导出
  exportNote(): void {
    if (!this.selectedNoteId()) return;
    const content = this.getEditorContent();
    const editTitle = this.editTitle();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${editTitle}</title>
<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7;}
table{border-collapse:collapse;width:100%;}th,td{border:1px solid #d9d9d9;padding:6px 10px;}
th{background:#fafafa;font-weight:600;}</style></head><body>
<h1>${editTitle}</h1>${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (editTitle || 'note') + '.html';
    a.click();
    URL.revokeObjectURL(url);
  }
}
