import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzColorPickerModule } from 'ng-zorro-antd/color-picker';

import { NoteService, Notebook, Note } from '../../services/note.service';

type SidebarFilter = 'all' | 'favorite' | { notebookId: number } | { tag: string };

@Component({
  selector: 'app-tools-notes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzInputModule, NzMessageModule,
    NzModalModule, NzTagModule, NzToolTipModule, NzPopconfirmModule,
    NzEmptyModule, NzSelectModule, NzColorPickerModule,
  ],
  templateUrl: './tools-notes.component.html',
  styleUrl: './tools-notes.component.scss',
})
export class ToolsNotesComponent implements OnInit, OnDestroy {
  @ViewChild('editor') editorRef?: ElementRef<HTMLDivElement>;

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

  // Toolbar state
  textColor = '#262626';
  currentFontSize = 14;

  headingOptions = [
    { label: '正文', value: 'p' },
    { label: '标题 1', value: 'h1' },
    { label: '标题 2', value: 'h2' },
    { label: '标题 3', value: 'h3' },
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

  // === Toolbar Commands ===

  execCommand(cmd: string, value?: string): void {
    this.editorRef?.nativeElement.focus();
    document.execCommand(cmd, false, value);
    this.onContentChange();
  }

  onHeadingChange(tag: string): void {
    this.editorRef?.nativeElement.focus();
    if (tag === 'p') {
      document.execCommand('formatBlock', false, 'p');
    } else {
      document.execCommand('formatBlock', false, tag);
    }
    this.onContentChange();
  }

  onFontSizeChange(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value);
    if (isNaN(val) || val < 9 || val > 72) return;
    this.currentFontSize = val;
    this.applyFontSize(val);
  }

  onFontSizeInputBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value);
    if (isNaN(val) || val < 9) val = 9;
    if (val > 72) val = 72;
    input.value = String(val);
    this.currentFontSize = val;
    this.applyFontSize(val);
  }

  private applyFontSize(pt: number): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const editor = this.editorRef?.nativeElement;
    if (!editor) return;
    // Use fontSize command then swap <font> tags for <span> with exact pt
    document.execCommand('fontSize', false, '7');
    const fonts = editor.querySelectorAll('font[size="7"]');
    fonts.forEach(f => {
      const span = document.createElement('span');
      span.style.fontSize = pt + 'pt';
      span.innerHTML = f.innerHTML;
      f.replaceWith(span);
    });
    this.onContentChange();
  }

  onTextColorChange(color: string): void {
    this.textColor = color;
    this.editorRef?.nativeElement.focus();
    document.execCommand('foreColor', false, color);
    this.onContentChange();
  }

  toggleBold(): void { this.execCommand('bold'); }
  toggleItalic(): void { this.execCommand('italic'); }
  toggleUnderline(): void { this.execCommand('underline'); }
  toggleStrike(): void { this.execCommand('strikeThrough'); }

  insertList(type: string): void {
    this.editorRef?.nativeElement.focus();
    if (type === 'ol') {
      document.execCommand('insertOrderedList');
    } else if (type === 'ol-alpha') {
      document.execCommand('insertOrderedList');
      const editor = this.editorRef?.nativeElement;
      const ols = editor?.querySelectorAll('ol');
      if (ols) {
        const lastOl = ols[ols.length - 1];
        if (lastOl) lastOl.style.listStyleType = 'lower-alpha';
      }
    } else {
      document.execCommand('insertUnorderedList');
    }
    this.onContentChange();
  }

  insertChecklist(): void {
    this.editorRef?.nativeElement.focus();
    const html = '<div style="display:flex;align-items:center;gap:6px;margin:2px 0;"><input type="checkbox" style="width:16px;height:16px;cursor:pointer;" onclick="this.parentElement?.querySelector(\'span\')?.classList?.toggle(\'checked\'); if(this.checked){this.parentElement.querySelector(\'span\')?.style?.setProperty(\'text-decoration\',\'line-through\');}else{this.parentElement.querySelector(\'span\')?.style?.removeProperty(\'text-decoration\');}" /><span style="flex:1;" contenteditable="true">待办事项</span></div>';
    document.execCommand('insertHTML', false, html);
    this.onContentChange();
  }

  insertTable(): void {
    this.modal.confirm({
      nzTitle: '插入表格',
      nzContent: `
        <div style="display:flex;gap:12px;margin-top:8px;">
          <div style="flex:1;">
            <label style="display:block;margin-bottom:4px;font-size:13px;">行数</label>
            <input id="table-rows" class="ant-input" type="number" value="3" min="1" max="20" />
          </div>
          <div style="flex:1;">
            <label style="display:block;margin-bottom:4px;font-size:13px;">列数</label>
            <input id="table-cols" class="ant-input" type="number" value="3" min="1" max="10" />
          </div>
        </div>
      `,
      nzOnOk: () => {
        const rows = parseInt((document.getElementById('table-rows') as HTMLInputElement)?.value || '3');
        const cols = parseInt((document.getElementById('table-cols') as HTMLInputElement)?.value || '3');
        this.doInsertTable(rows, cols);
      },
    });
  }

  private doInsertTable(rows: number, cols: number): void {
    this.editorRef?.nativeElement.focus();
    let html = '<table style="border-collapse:collapse;width:100%;margin:8px 0;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? 'th' : 'td';
        const style = 'border:1px solid var(--border-color, #d9d9d9);padding:6px 10px;min-width:60px;';
        const bgStyle = r === 0 ? 'background:var(--bg-tertiary, #fafafa);font-weight:600;' : '';
        html += `<${tag} style="${style}${bgStyle}">${r === 0 ? '表头' : ''}</${tag}>`;
      }
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    document.execCommand('insertHTML', false, html);
    this.onContentChange();
  }

  insertDivider(): void {
    this.editorRef?.nativeElement.focus();
    document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid var(--border-light, #e8e8e8);margin:12px 0;" /><p><br></p>');
    this.onContentChange();
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
    this.editTags = [...(note.tags || [])];
    this.isDirty = false;

    // Set editor content after view updates
    setTimeout(() => {
      if (this.editorRef?.nativeElement) {
        this.editorRef.nativeElement.innerHTML = note.content || '';
      }
    }, 0);
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
    // Strip HTML tags for summary
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

  onContentChange(): void {
    this.isDirty = true;
    this.autoSaveSubject.next();
  }

  onTitleChange(): void {
    this.isDirty = true;
    this.autoSaveSubject.next();
  }

  private getEditorContent(): string {
    return this.editorRef?.nativeElement?.innerHTML || '';
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

  // === Image Upload ===

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.uploadAndInsert(file);
    input.value = '';
  }

  private uploadAndInsert(file: File): void {
    this.noteService.uploadImage(file).subscribe(res => {
      const img = `<img src="${res.url}" alt="${file.name}" style="max-width:100%;border-radius:4px;margin:4px 0;" />`;
      this.editorRef?.nativeElement.focus();
      document.execCommand('insertHTML', false, img);
      this.onContentChange();
    });
  }
}
