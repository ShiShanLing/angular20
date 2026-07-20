import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzInputModule,
    NzModalModule, NzTagModule, NzTooltipModule, NzPopconfirmModule,
    NzEmptyModule, NzSelectModule, NzInputNumberModule, QuillModule,
  ],
  templateUrl: './tools-notes.component.html',
  styleUrl: './tools-notes.component.scss',
})
export class ToolsNotesComponent implements OnInit, OnDestroy {
  @ViewChild('quillEditor') quillEditorRef?: any;

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
  editTags: string[] = [];
  newTag = '';
  isDirty = false;
  private autoSaveSubject = new Subject<void>();
  private quillInstance: any = null;
  editorContent = '';

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

  constructor(
    private noteService: NoteService,
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

  insertTable(): void {
    this.tableRows = 3;
    this.tableCols = 3;
    this.showTableModal = true;
  }

  confirmInsertTable(): void {
    if (!this.quillInstance) return;
    const table = this.quillInstance.getModule('table');
    if (table) {
      table.insertTable(this.tableRows, this.tableCols);
    }
    this.showTableModal = false;
  }

  onEditorCreated(editor: any): void {
    this.quillInstance = editor;
  }

  onContentChanged(): void {
    this.isDirty = true;
    this.autoSaveSubject.next();
  }

  // Table insert state
  showTableModal = false;
  tableRows = 3;
  tableCols = 3;

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
    this.editTags = [...(note.tags || [])];
    this.editorContent = note.content || '';
    this.isDirty = false;

    // Load content into existing editor instance
    if (this.quillInstance) {
      this.quillInstance.root.innerHTML = note.content || '';
    }
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
    const div = document.createElement('div');
    div.innerHTML = note.content || '';
    const text = div.textContent?.trim() || '';
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

  private getEditorContent(): string {
    if (!this.quillInstance) return '';
    return this.quillInstance.root.innerHTML;
  }

  onTitleChange(): void {
    this.isDirty = true;
    this.autoSaveSubject.next();
  }

  saveCurrentNote(): void {
    if (!this.selectedNoteId || !this.isDirty) return;
    this.noteService.updateNote(this.selectedNoteId, {
      title: this.editTitle,
      content: this.getEditorContent(),
      tags: this.editTags,
    }).subscribe(() => {
      this.isDirty = false;
      this.loadNotes();
    });
  }

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

  exportNote(): void {
    if (!this.selectedNoteId) return;
    const content = this.getEditorContent();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${this.editTitle}</title>
<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7;}
table{border-collapse:collapse;width:100%;}th,td{border:1px solid #d9d9d9;padding:6px 10px;}
th{background:#fafafa;font-weight:600;}</style></head><body>
<h1>${this.editTitle}</h1>${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (this.editTitle || 'note') + '.html';
    a.click();
    URL.revokeObjectURL(url);
  }
}
