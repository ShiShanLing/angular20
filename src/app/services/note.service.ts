import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notebook {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

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

@Injectable({ providedIn: 'root' })
export class NoteService {
  private readonly base = '/api';

  constructor(private http: HttpClient) {}

  // Notebooks
  getNotebooks(): Observable<Notebook[]> {
    return this.http.get<Notebook[]>(`${this.base}/notebooks`);
  }

  createNotebook(name: string): Observable<Notebook> {
    return this.http.post<Notebook>(`${this.base}/notebooks`, { name });
  }

  renameNotebook(id: number, name: string): Observable<Notebook> {
    return this.http.put<Notebook>(`${this.base}/notebooks/${id}`, { name });
  }

  deleteNotebook(id: number): Observable<any> {
    return this.http.delete(`${this.base}/notebooks/${id}`);
  }

  // Notes
  getNotes(params?: { notebookId?: number | null; search?: string; tag?: string; isFavorite?: boolean }): Observable<Note[]> {
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

  getNote(id: number): Observable<Note> {
    return this.http.get<Note>(`${this.base}/notes/${id}`);
  }

  createNote(title: string, content?: string, notebookId?: number | null, tags?: string[]): Observable<Note> {
    return this.http.post<Note>(`${this.base}/notes`, { title, content, notebookId, tags });
  }

  updateNote(id: number, data: Partial<Note>): Observable<Note> {
    return this.http.put<Note>(`${this.base}/notes/${id}`, data);
  }

  deleteNote(id: number): Observable<any> {
    return this.http.delete(`${this.base}/notes/${id}`);
  }

  exportNote(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/notes/${id}/export`, { responseType: 'blob' });
  }

  uploadImage(file: File): Observable<{ url: string; originalName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; originalName: string }>(`${this.base}/notes/upload`, formData);
  }
}
