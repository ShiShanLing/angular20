import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TextFieldModule } from '@angular/cdk/text-field';

/** 开发常用小工具：时间戳/编码解码等（多 Tab）。 */
@Component({
  selector: 'app-tools-dev',
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzInputModule, NzButtonModule, NzSpaceModule,
    NzTabsModule, NzGridModule, NzIconModule, TextFieldModule
  ],
  providers: [DatePipe],
  templateUrl: './tools-dev.component.html',
  styleUrl: './tools-dev.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolsDevComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly datePipe = inject(DatePipe);

  // Timestamp
  readonly currentTimestamp = signal(Date.now());
  readonly inputTimestamp = signal('');
  readonly outputTime = signal('');
  readonly inputTime = signal('');
  readonly outputTimestamp = signal('');

  // JSON
  readonly jsonInput = signal('');
  readonly jsonOutput = signal('');

  // Encoders
  readonly base64Input = signal('');
  readonly base64Output = signal('');

  readonly urlInput = signal('');
  readonly urlOutput = signal('');

  private timer: any;

  // MARK: 初始化
  // 组件初始化：同步移动端断点、订阅视口变化与路由事件
  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.currentTimestamp.set(Date.now());
    }, 1000);

    this.jsonInput.set(localStorage.getItem('tools_dev_json') || '');
    this.base64Input.set(localStorage.getItem('tools_dev_base64') || '');
    this.urlInput.set(localStorage.getItem('tools_dev_url') || '');
  }
  // MARK: 销毁清理
  // 取消全部订阅，避免内存泄漏
  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  // MARK: 事件处理
  onJsonInputChange(value: string): void {
    this.jsonInput.set(value);
    localStorage.setItem('tools_dev_json', value);
  }

  // MARK: 事件处理
  onBase64InputChange(value: string): void {
    this.base64Input.set(value);
    localStorage.setItem('tools_dev_base64', value);
  }

  // MARK: 事件处理
  onUrlInputChange(value: string): void {
    this.urlInput.set(value);
    localStorage.setItem('tools_dev_url', value);
  }

  // --- Timestamp Methods ---
  // MARK: 时间戳转
  convertTsToTime(): void {
    const inputTimestamp = this.inputTimestamp();
    if (!inputTimestamp) return;
    let ts = Number(inputTimestamp);
    if (inputTimestamp.length <= 10) ts *= 1000; // handle seconds
    this.outputTime.set(this.datePipe.transform(ts, 'yyyy-MM-dd HH:mm:ss') || '');
  }

  // MARK: 转时间戳
  convertTimeToTs(): void {
    if (!this.inputTime()) return;
    const d = new Date(this.inputTime());
    if (isNaN(d.getTime())) {
      this.msg.error('时间格式错误');
      return;
    }
    this.outputTimestamp.set(d.getTime().toString());
  }

  // --- JSON Methods ---
  // MARK: 格式化
  formatJson(): void {
    if (!this.jsonInput()) return;
    try {
      const obj = JSON.parse(this.jsonInput());
      this.jsonOutput.set(JSON.stringify(obj, null, 2));
      this.msg.success('JSON 格式化成功');
    } catch (e) { 
      this.msg.error('JSON 格式无效');
    }
  }

  // MARK: 压缩JSON
  compressJson(): void {
    if (!this.jsonInput()) return;
    try {
      const obj = JSON.parse(this.jsonInput());
      this.jsonOutput.set(JSON.stringify(obj));
      this.msg.success('JSON 压缩成功');
    } catch (e) {
      this.msg.error('JSON 格式无效');
    }
  }

  // --- Base64 Methods ---
  // MARK: 编码
  encodeBase64(): void {
    if (!this.base64Input()) return;
    try {
      // support unicode
      this.base64Output.set(btoa(encodeURIComponent(this.base64Input()).replace(/%([0-9A-F]{2})/g,
          (match, p1) => { return String.fromCharCode(Number('0x' + p1)); }
      )));
    } catch(e) {
      this.msg.error('编码失败');
    }
  }

  // MARK: 解码
  decodeBase64(): void {
    if (!this.base64Input()) return;
    try {
      this.base64Output.set(decodeURIComponent(Array.prototype.map.call(atob(this.base64Input()),
          (c) => { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }
      ).join('')));
    } catch(e) {
      this.msg.error('解码失败，可能不是有效的 Base64 字符串');
    }
  }

  // --- URL Methods ---
  // MARK: 编码
  encodeUrl(): void {
    if (!this.urlInput()) return;
    this.urlOutput.set(encodeURIComponent(this.urlInput()));
  }

  // MARK: 解码
  decodeUrl(): void {
    if (!this.urlInput()) return;
    try {
      this.urlOutput.set(decodeURIComponent(this.urlInput()));
    } catch(e) {
      this.msg.error('解码失败');
    }
  }

  // Utils
  // MARK: 复制
  copy(text: string): void {
    if (!text) {
      this.msg.warning('内容为空');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      this.msg.success('复制成功');
    });
  }
}
