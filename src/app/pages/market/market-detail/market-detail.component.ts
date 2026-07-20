import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzResultModule } from 'ng-zorro-antd/result';
import { MarketService, MarketReportDetail } from '../market.service';

@Component({
  selector: 'app-market-detail',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule, NzIconModule, NzSpinModule, NzResultModule,
  ],
  templateUrl: './market-detail.component.html',
  styles: [`
    :host { display: block; padding: 16px; }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .toolbar h3 {
      margin: 0;
      font-size: 16px;
      color: #1e3a5f;
    }
    .report-frame {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      overflow: auto;
    }
  `],
})
export class MarketDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly marketService = inject(MarketService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly report = signal<MarketReportDetail | null>(null);
  readonly date = signal('');

  readonly safeHtml = computed<SafeHtml | null>(() => {
    const r = this.report();
    if (!r?.htmlContent) return null;
    return this.sanitizer.bypassSecurityTrustHtml(r.htmlContent);
  });

  ngOnInit(): void {
    console.log('[DETAIL] ngOnInit called');
    console.log('[DETAIL] route URL:', this.route.snapshot.url);
    console.log('[DETAIL] queryParams:', this.route.snapshot.queryParams);
    const date = this.route.snapshot.queryParamMap.get('date') || '';
    console.log('[DETAIL] date param:', date);
    this.date.set(date);
    if (!date) {
      this.error.set('缺少日期参数');
      this.loading.set(false);
      return;
    }
    console.log('[DETAIL] calling API:', date);
    this.marketService.getDetail(date).subscribe({
      next: (data: MarketReportDetail | null) => {
        console.log('[DETAIL] API success, data length:', data?.htmlContent?.length);
        if (!data) {
          this.error.set(`未找到 ${date} 的报告`);
        } else {
          this.report.set(data);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('[DETAIL] API error:', err);
        this.error.set(err.message || '加载失败');
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/market']);
  }
}
