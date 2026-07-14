import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, debounceTime } from 'rxjs';
import { marked } from 'marked';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

import { NoteService, Notebook, Note } from '../../services/note.service';

type ViewMode = 'edit' | 'preview' | 'split';
type SidebarFilter = 'all' | 'favorite' | { notebookId: number } | { tag: string };

@Component({
  selector: 'app-tools-notes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzInputModule, NzMessageModule,
    NzModalModule, NzTagModule, NzToolTipModule, NzPopconfirmModule,
    NzEmptyModule, NzBadgeModule,
  ],
  templateUrl: './tools-notes.component.html',
  styleUrl: './tools-notes.component.scss',
})
export class ToolsNotesComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editorRef?: ElementRef<HTMLTextAreaElement>;

  // Sidebar
  notebooks: Notebook[] = [];
  sidebarFilter: SidebarFilter = 'all';
  allTags: string[] = [];

  // Note list
  notes: Note[] = [];
  selectedNoteId: number | null = null;
  searchQuery = '';
  private searchSubject = new Subject<string>();

  // Editor
  editTitle = '';
  editContent = '';
  editTags: string[] = [];
  newTag = '';
  viewMode: ViewMode = 'split';
  previewHtml: SafeHtml = '';
  isDirty = false;
  private autoSaveSubject = new Subject<void>();

  constructor(
    private noteService: NoteService,
    private sanitizer: DomSanitizer,
    private msg: NzMessageService,
    private modal: NzModalService,
  ) {}

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

  ngOnDestroy(): void {
    this.searchSubject.complete();
    this.autoSaveSubject.complete();
    if (this.isDirty && this.selectedNoteId) {
      this.saveCurrentNote();
    }
  }

  // === Sidebar ===

  loadNotebooks(): void {
    this.noteService.getNotebooks().subscribe(nbs => {
      this.notebooks = nbs;
    });
  }

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
            this.sidebarFilter = 'all';
            this.loadNotes();
          }
          this.msg.success('文件夹已删除');
        });
      },
    });
  }

  selectSidebar(filter: SidebarFilter): void {
    this.sidebarFilter = filter;
    this.loadNotes();
  }

  isFilterActive(filter: SidebarFilter): boolean {
    if (filter === 'all' && this.sidebarFilter === 'all') return true;
    if (filter === 'favorite' && this.sidebarFilter === 'favorite') return true;
    if (typeof filter === 'object' && typeof this.sidebarFilter === 'object') {
      return JSON.stringify(filter) === JSON.stringify(this.sidebarFilter);
    }
    return false;
  }

  isNotebookSelected(id: number): boolean {
    return typeof this.sidebarFilter === 'object' && 'notebookId' in this.sidebarFilter && this.sidebarFilter.notebookId === id;
  }

  // === Notes List ===

  loadNotes(): void {
    const params: any = {};
    if (this.sidebarFilter === 'favorite') {
      params.isFavorite = true;
    } else if (typeof this.sidebarFilter === 'object') {
      if ('notebookId' in this.sidebarFilter) params.notebookId = this.sidebarFilter.notebookId;
      if ('tag' in this.sidebarFilter) params.tag = this.sidebarFilter.tag;
    }
    if (this.searchQuery) params.search = this.searchQuery;

    this.noteService.getNotes(params).subscribe(notes => {
      this.notes = notes;
      this.extractAllTags();
    });
  }

  onSearch(): void {
    this.searchSubject.next('');
  }

  selectNote(note: Note): void {
    if (this.isDirty && this.selectedNoteId) {
      this.saveCurrentNote();
    }
    this.selectedNoteId = note.id;
    this.editTitle = note.title;
    this.editContent = note.content;
    this.editTags = [...(note.tags || [])];
    this.isDirty = false;
    this.updatePreview();
  }

  isSelected(note: Note): boolean {
    return this.selectedNoteId === note.id;
  }

  createNote(): void {
    let notebookId: number | null = null;
    if (typeof this.sidebarFilter === 'object' && 'notebookId' in this.sidebarFilter) {
      notebookId = this.sidebarFilter.notebookId;
    }
    this.noteService.createNote('无标题', '', notebookId).subscribe(note => {
      this.loadNotes();
      this.selectNote(note);
    });
  }

  deleteNote(note: Note, event: Event): void {
    event.stopPropagation();
    this.modal.confirm({
      nzTitle: `删除笔记「${note.title}」？`,
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.noteService.deleteNote(note.id).subscribe(() => {
          if (this.selectedNoteId === note.id) {
            this.selectedNoteId = null;
            this.editTitle = '';
            this.editContent = '';
            this.editTags = [];
          }
          this.loadNotes();
          this.msg.success('笔记已删除');
        });
      },
    });
  }

  togglePin(note: Note, event: Event): void {
    event.stopPropagation();
    this.noteService.updateNote(note.id, { isPinned: !note.isPinned }).subscribe(updated => {
      note.isPinned = updated.isPinned;
    });
  }

  toggleFavorite(note: Note, event: Event): void {
    event.stopPropagation();
    this.noteService.updateNote(note.id, { isFavorite: !note.isFavorite }).subscribe(updated => {
      note.isFavorite = updated.isFavorite;
    });
  }

  getNoteSummary(note: Note): string {
    const text = note.content.replace(/[#*`>\-\[\]!()]/g, '').trim();
    return text.substring(0, 60) || '暂无内容';
  }

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

  onContentChange(): void {
    this.isDirty = true;
    this.updatePreview();
    this.autoSaveSubject.next();
  }

  onTitleChange(): void {
    this.isDirty = true;
    this.autoSaveSubject.next();
  }

  saveCurrentNote(): void {
    if (!this.selectedNoteId || !this.isDirty) return;
    this.noteService.updateNote(this.selectedNoteId, {
      title: this.editTitle,
      content: this.editContent,
      tags: this.editTags,
    }).subscribe(() => {
      this.isDirty = false;
      // Refresh the list to update title/summary
      this.loadNotes();
    });
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    if (mode !== 'edit') {
      this.updatePreview();
    }
  }

  private updatePreview(): void {
    const html = marked.parse(this.editContent || '') as string;
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // === Tags ===

  addTag(): void {
    const tag = this.newTag.trim();
    if (tag && !this.editTags.includes(tag)) {
      this.editTags.push(tag);
      this.isDirty = true;
      this.autoSaveSubject.next();
    }
    this.newTag = '';
  }

  removeTag(tag: string): void {
    this.editTags = this.editTags.filter(t => t !== tag);
    this.isDirty = true;
    this.autoSaveSubject.next();
  }

  filterByTag(tag: string): void {
    this.sidebarFilter = { tag };
    this.loadNotes();
  }

  private extractAllTags(): void {
    const tagSet = new Set<string>();
    this.notes.forEach(n => n.tags?.forEach(t => tagSet.add(t)));
    this.allTags = Array.from(tagSet).sort();
  }

  // === Export ===

  get currentNotePinned(): boolean {
    const note = this.notes.find(n => n.id === this.selectedNoteId);
    return note?.isPinned || false;
  }

  togglePinCurrent(): void {
    if (!this.selectedNoteId) return;
    const note = this.notes.find(n => n.id === this.selectedNoteId);
    if (!note) return;
    this.noteService.updateNote(note.id, { isPinned: !note.isPinned }).subscribe(updated => {
      note.isPinned = updated.isPinned;
    });
  }

  exportNote(): void {
    if (!this.selectedNoteId) return;
    this.noteService.exportNote(this.selectedNoteId).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (this.editTitle || 'note') + '.md';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // === Image Upload ===

  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        event.preventDefault();
        const file = items[i].getAsFile();
        if (file) this.uploadAndInsert(file);
        return;
      }
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.uploadAndInsert(file);
    input.value = '';
  }

  private uploadAndInsert(file: File): void {
    this.noteService.uploadImage(file).subscribe(res => {
      const md = `![${file.name}](${res.url})`;
      const textarea = this.editorRef?.nativeElement;
      if (textarea) {
        const start = textarea.selectionStart;
        this.editContent = this.editContent.substring(0, start) + md + this.editContent.substring(textarea.selectionEnd);
        this.onContentChange();
      } else {
        this.editContent += '\n' + md;
        this.onContentChange();
      }
    });
  }
}
