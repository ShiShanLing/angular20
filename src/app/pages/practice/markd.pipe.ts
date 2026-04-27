import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.use({ gfm: true, breaks: true });

@Pipe({
  name: 'markd',
  standalone: true,
})
export class MarkdPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

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
