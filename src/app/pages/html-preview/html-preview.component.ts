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
  //export class HtmlSample {
  //  label:string,
  //  path: string;
  //}
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
  
  /*
### 7. Protocol 和 Class 继承有什么区别？为什么 Swift 强调面向协议编程？

- 难度：Medium
- ID：`ios-swift-protocol-vs-inheritance`
- 口述一句话：继承表达类型层级，协议表达能力边界。

**参考答案：**

继承表达“是什么”，协议表达“能做什么”。Class 继承只能单继承，协议可以多遵循；继承复用实现但耦合更强，协议更适合抽象能力、依赖倒置和测试替换。Swift 面向协议编程的重点是用协议定义边界，用扩展提供默认实现。

### 8. Protocol Extension 中的方法什么时候是静态派发，什么时候会动态派发？

- 难度：Hard
- ID：`ios-swift-protocol-extension-dispatch`
- 口述一句话：协议要求的方法，通过协议类型调用通常走动态派发；协议扩展里的非要求方法，更偏静态派发。

**参考答案：**

协议要求的方法，也就是写在 protocol 声明里的 requirement，通过协议类型调用时通常走 witness table 动态派发，所以能调用到具体类型的实现。

如果方法只是写在 protocol extension 里的额外方法，不是 requirement，那么它更偏静态派发，调用哪个实现取决于变量的静态类型，容易调用到扩展默认实现。

可以这样收口：协议要求的方法，通过协议类型调用通常走动态派发；协议扩展里的非要求方法，更偏静态派发，容易调用到扩展默认实现。

  */
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
