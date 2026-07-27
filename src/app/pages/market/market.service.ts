import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** 市场情绪报告列表项（不含 HTML 正文） */
export interface MarketReportItem {
  id: number;
  date: string;
  aiIndex: number | null;
  kwIndex: number | null;
  totalPosts: number;
  bullish: number;
  bearish: number;
  fear: number;
  greed: number;
  neutral: number;
  bearFearPct: number;
  panicTotal: number;
  createdAt: string;
}

/** 市场情绪报告详情（含 HTML 正文与板块数据） */
export interface MarketReportDetail extends MarketReportItem {
  sectors: any;
  htmlContent: string;
}

/** 分页列表响应 */
export interface PaginatedResult {
  items: MarketReportItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** 趋势图数据点 */
export interface TrendItem {
  date: string;
  aiIndex: number | null;
  kwIndex: number | null;
  panicTotal: number | null;
  bearFearPct: number;
  totalPosts: number;
}

/**
 * 市场情绪报告服务。
 * 提供列表、详情与最近 N 天趋势数据查询。
 */
@Injectable({ providedIn: 'root' })
export class MarketService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/market-reports';

  // MARK: 查询列表
  getList(page = 1, pageSize = 20): Observable<PaginatedResult> {
    return this.http.get<PaginatedResult>(this.base, {
      params: { page: String(page), pageSize: String(pageSize) },
    });
  }

  // MARK: 查询详情
  getDetail(date: string): Observable<MarketReportDetail> {
    return this.http.get<MarketReportDetail>(`${this.base}/${date}`);
  }

  // MARK: 查询趋势
  getTrend(days = 30): Observable<TrendItem[]> {
    return this.http.get<TrendItem[]>(`${this.base}/trend`, {
      params: { days: String(days) },
    });
  }
}
