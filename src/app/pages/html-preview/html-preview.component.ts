import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface HtmlSample {
  label: string;
  path: string;
}

@Component({
  selector: 'app-html-preview',
  imports: [CommonModule],
  templateUrl: './html-preview.component.html',
  styleUrl: './html-preview.component.scss'
})
export class HtmlPreviewComponent {
  readonly samples: HtmlSample[] = [
    { label: 'test.html', path: '/test/test.html' },
    { label: 'test1.html', path: '/test/test1.html' },
    { label: '杨森.html', path: '/test/杨森.html' },
    { label: '个人信息处理授权同意书_杨森格式.html', path: '/test/个人信息处理授权同意书_杨森格式.html' }
  ];

  readonly selectedPath = signal(this.samples[0].path);
  readonly rawHtml = signal('');
  readonly decodedHtml = computed(() => this.decodeHtmlString(this.rawHtml()));
  readonly trustedHtml = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.decodedHtml())
  );
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer
  ) {
    this.load(this.selectedPath());
  }
  
  selectSample(path: string): void {
    if (this.selectedPath() === path) {
      return;
    }
    this.selectedPath.set(path);
    this.load(path);
  }
  
  
  reload(): void {
    this.load(this.selectedPath());
  }

  private load(path: string): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get(path, { responseType: 'text' }).subscribe({
      next: html => {
        this.rawHtml.set(html);
        this.loading.set(false);
      },
      error: () => {
        this.rawHtml.set('');
        this.error.set(`读取失败：${path}`);
        this.loading.set(false);
      }
    });
  }

  private decodeHtmlString(value: string): string {
    return value
      .replace(/^\uFEFF/, '')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '');
  }
}
