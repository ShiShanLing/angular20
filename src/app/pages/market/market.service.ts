import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface MarketReportDetail extends MarketReportItem {
  sectors: any;
  htmlContent: string;
}

export interface PaginatedResult {
  items: MarketReportItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TrendItem {
  date: string;
  aiIndex: number | null;
  kwIndex: number | null;
  panicTotal: number | null;
  bearFearPct: number;
  totalPosts: number;
}

@Injectable({ providedIn: 'root' })
export class MarketService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/market-reports';

  getList(page = 1, pageSize = 20): Observable<PaginatedResult> {
    return this.http.get<PaginatedResult>(this.base, {
      params: { page: String(page), pageSize: String(pageSize) },
    });
  }

  getDetail(date: string): Observable<MarketReportDetail> {
    return this.http.get<MarketReportDetail>(`${this.base}/${date}`);
  }

  getTrend(days = 30): Observable<TrendItem[]> {
    return this.http.get<TrendItem[]>(`${this.base}/trend`, {
      params: { days: String(days) },
    });
  }
}
