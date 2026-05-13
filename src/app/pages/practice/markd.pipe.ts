import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.use({ gfm: true, breaks: true });

/** 将 Markdown 渲染为经过净化处理的 SafeHtml，供模板 `[innerHTML]` 绑定。 */
@Pipe({
  name: 'markd',
  standalone: true,
})
export class MarkdPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  /** @param value 原始 Markdown；空则返回空安全 HTML */
  transform(value: string | null | undefined): SafeHtml {
    const raw = value?.trim() ? value : '';
    if (!raw) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    const html = marked.parse(raw, { async: false }) as string;
    const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}
