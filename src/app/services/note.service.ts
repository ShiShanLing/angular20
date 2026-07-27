import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** 笔记本（文件夹） */
export interface Notebook {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** 单条笔记 */
export interface Note {
  id: number;
  notebookId: number | null;
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 记事本服务。
 * 管理笔记本、笔记 CRUD，以及图片上传与导出。
 */
@Injectable({ providedIn: 'root' })
export class NoteService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  // ─── Notebooks ─────────────────────────────────────────────────────────────

  // MARK: 获取
  getNotebooks(): Observable<Notebook[]> {
    return this.http.get<Notebook[]>(`${this.base}/notebooks`);
  }

  // MARK: 创建
  createNotebook(name: string): Observable<Notebook> {
    return this.http.post<Notebook>(`${this.base}/notebooks`, { name });
  }

  // MARK: 重命名本
  renameNotebook(id: number, name: string): Observable<Notebook> {
    return this.http.put<Notebook>(`${this.base}/notebooks/${id}`, { name });
  }

  // MARK: 删除
  deleteNotebook(id: number): Observable<any> {
    return this.http.delete(`${this.base}/notebooks/${id}`);
  }

  // ─── Notes ─────────────────────────────────────────────────────────────────

  // MARK: 获取
  getNotes(params?: {
    notebookId?: number | null;
    search?: string;
    tag?: string;
    isFavorite?: boolean;
  }): Observable<Note[]> {
    let url = `${this.base}/notes`;
    const query: string[] = [];
    if (params?.notebookId !== undefined && params.notebookId !== null) {
      query.push(`notebookId=${params.notebookId}`);
    }
    if (params?.search) query.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.tag) query.push(`tag=${encodeURIComponent(params.tag)}`);
    if (params?.isFavorite !== undefined) query.push(`isFavorite=${params.isFavorite}`);
    if (query.length) url += '?' + query.join('&');
    return this.http.get<Note[]>(url);
  }

  // MARK: 获取
  getNote(id: number): Observable<Note> {
    return this.http.get<Note>(`${this.base}/notes/${id}`);
  }

  // MARK: 创建
  createNote(
    title: string,
    content?: string,
    notebookId?: number | null,
    tags?: string[],
  ): Observable<Note> {
    return this.http.post<Note>(`${this.base}/notes`, { title, content, notebookId, tags });
  }

  // MARK: 更新笔记
  updateNote(id: number, data: Partial<Note>): Observable<Note> {
    return this.http.put<Note>(`${this.base}/notes/${id}`, data);
  }

  // MARK: 删除笔记
  deleteNote(id: number): Observable<any> {
    return this.http.delete(`${this.base}/notes/${id}`);
  }

  // MARK: 导出
  exportNote(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/notes/${id}/export`, { responseType: 'blob' });
  }

  // MARK: 上传
  uploadImage(file: File): Observable<{ url: string; originalName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; originalName: string }>(
      `${this.base}/notes/upload`,
      formData,
    );
  }
}
