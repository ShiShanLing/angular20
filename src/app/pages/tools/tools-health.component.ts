import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-tools-health',
  templateUrl: './tools-health.component.html',
  styleUrl: './tools-health.component.scss'
})
export class ToolsHealthComponent {
  url: SafeResourceUrl;

  constructor(sanitizer: DomSanitizer) {
    // 通过 iframe 嵌入 public 下的独立页面，避免重复实现 UI 与计算逻辑。
    this.url = sanitizer.bypassSecurityTrustResourceUrl('./health-tools.html');
  }
}

