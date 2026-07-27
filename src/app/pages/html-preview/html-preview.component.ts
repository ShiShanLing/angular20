import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface HtmlSample {
  label: string;
  path: string;
}

@Component({
  selector: 'app-html-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './html-preview.component.html',
  styleUrl: './html-preview.component.scss',
})
export class HtmlPreviewComponent {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  readonly samples: HtmlSample[] = [
    { label: 'test.html', path: '/test/test.html' },
    { label: 'test1.html', path: '/test/test1.html' },
    { label: '杨森.html', path: '/test/杨森.html' },
    { label: '个人信息处理授权同意书_杨森格式.html', path: '/test/个人信息处理授权同意书_杨森格式.html' },
  ];

  readonly selectedPath = signal(this.samples[0].path);
  readonly rawHtml = signal('');
  readonly decodedHtml = computed(() => this.decodeHtmlString(this.rawHtml()));
  readonly trustedHtml = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.decodedHtml()),
  );
  readonly loading = signal(false);
  readonly error = signal('');

  // MARK: 构造注入
  // 启动时加载默认示例
  constructor() {
    this.load(this.selectedPath());
  }

  // MARK: 选择示例
  selectSample(path: string): void {
    if (this.selectedPath() === path) {
      return;
    }
    this.selectedPath.set(path);
    this.load(path);
  }

  // MARK: 重新加载
  reload(): void {
    this.load(this.selectedPath());
  }

  // MARK: 加载数据
  // 按路径拉取 HTML 文本并更新预览
  private load(path: string): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get(path, { responseType: 'text' }).subscribe({
      next: (html) => {
        this.rawHtml.set(html);
        this.loading.set(false);
      },
      error: () => {
        this.rawHtml.set('');
        this.error.set(`读取失败：${path}`);
        this.loading.set(false);
      },
    });
  }

  // MARK: 解码HTML
  private decodeHtmlString(value: string): string {
    return value
      .replace(/^\uFEFF/, '')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '');
  }
}
