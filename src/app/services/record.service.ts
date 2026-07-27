import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * 通用业务记录服务。
 * 统一管理体重、睡眠、记账、房贷参数等按 type 分类的用户数据。
 */
@Injectable({ providedIn: 'root' })
export class RecordService {
  private readonly http = inject(HttpClient);

  // MARK: 获取
  getAll(type?: string, startDate?: string, endDate?: string) {
    const params: any = {};
    if (type) params['type'] = type;
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.http.get<any[]>('/api/records', { params });
  }

  // MARK: 创建
  create(type: string, data: any, recordDate?: string) {
    return this.http.post<any>('/api/records', { type, data, recordDate });
  }

  // MARK: 更新
  update(id: number, data: any, recordDate?: string) {
    return this.http.put<any>(`/api/records/${id}`, { data, recordDate });
  }

  // MARK: 删除
  delete(id: number) {
    return this.http.delete<any>(`/api/records/${id}`);
  }

  // MARK: 批量同步
  bulkSync(type: string, records: any[]) {
    return this.http.post<any>('/api/records/sync', { type, records });
  }
}
