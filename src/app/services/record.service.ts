import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RecordService {
  constructor(private http: HttpClient) {}

  getAll(type?: string, startDate?: string, endDate?: string) {
    const params: any = {};
    if (type) params['type'] = type;
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.http.get<any[]>('/api/records', { params });
  }

  create(type: string, data: any, recordDate?: string) {
    return this.http.post<any>('/api/records', { type, data, recordDate });
  }

  update(id: number, data: any, recordDate?: string) {
    return this.http.put<any>(`/api/records/${id}`, { data, recordDate });
  }

  delete(id: number) {
    return this.http.delete<any>(`/api/records/${id}`);
  }

  bulkSync(type: string, records: any[]) {
    return this.http.post<any>('/api/records/sync', { type, records });
  }
}
