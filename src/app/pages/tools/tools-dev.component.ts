import { Component, OnDestroy, OnInit } from '@angular/core';
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

/** 开发常用小工具：时间戳/编码解码等（多 Tab）。 */
@Component({
  selector: 'app-tools-dev',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzInputModule, NzButtonModule, NzSpaceModule,
    NzTabsModule, NzGridModule, NzIconModule
  ],
  providers: [DatePipe],
  templateUrl: './tools-dev.component.html',
  styleUrl: './tools-dev.component.scss'
})
export class ToolsDevComponent implements OnInit, OnDestroy {
  
  // Timestamp
  currentTimestamp: number = Date.now();
  inputTimestamp: string = '';
  outputTime: string = '';
  inputTime: string = '';
  outputTimestamp: string = '';

  // JSON
  private _jsonInput: string = '';
  get jsonInput(): string { return this._jsonInput; }
  set jsonInput(v: string) {
    this._jsonInput = v;
    localStorage.setItem('tools_dev_json', v);
  }
  jsonOutput: string = '';

  // Encoders
  private _base64Input: string = '';
  get base64Input(): string { return this._base64Input; }
  set base64Input(v: string) {
    this._base64Input = v;
    localStorage.setItem('tools_dev_base64', v);
  }
  base64Output: string = '';
  
  private _urlInput: string = '';
  get urlInput(): string { return this._urlInput; }
  set urlInput(v: string) {
    this._urlInput = v;
    localStorage.setItem('tools_dev_url', v);
  }
  urlOutput: string = '';

  private timer: any;

  constructor(private msg: NzMessageService, private datePipe: DatePipe) {}
  
  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.currentTimestamp = Date.now();
    }, 1000);

    this._jsonInput = localStorage.getItem('tools_dev_json') || '';
    this._base64Input = localStorage.getItem('tools_dev_base64') || '';
    this._urlInput = localStorage.getItem('tools_dev_url') || '';
  }
  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }


  // --- Timestamp Methods ---
  convertTsToTime(): void {
    if (!this.inputTimestamp) return;
    let ts = Number(this.inputTimestamp);
    if (this.inputTimestamp.length <= 10) ts *= 1000; // handle seconds
    this.outputTime = this.datePipe.transform(ts, 'yyyy-MM-dd HH:mm:ss') || '';
  }

  convertTimeToTs(): void {
    if (!this.inputTime) return;
    const d = new Date(this.inputTime);
    if (isNaN(d.getTime())) {
      this.msg.error('时间格式错误');
      return;
    }
    this.outputTimestamp = d.getTime().toString();
  }

  // --- JSON Methods ---
  formatJson(): void {
    if (!this.jsonInput) return;
    try {
      const obj = JSON.parse(this.jsonInput);
      this.jsonOutput = JSON.stringify(obj, null, 2);
      this.msg.success('JSON 格式化成功');
    } catch (e) { 
      this.msg.error('JSON 格式无效');
    }
  }

  compressJson(): void {
    if (!this.jsonInput) return;
    try {
      const obj = JSON.parse(this.jsonInput);
      this.jsonOutput = JSON.stringify(obj);
      this.msg.success('JSON 压缩成功');
    } catch (e) {
      this.msg.error('JSON 格式无效');
    }
  }

  // --- Base64 Methods ---
  encodeBase64(): void {
    if (!this.base64Input) return;
    try {
      // support unicode
      this.base64Output = btoa(encodeURIComponent(this.base64Input).replace(/%([0-9A-F]{2})/g,
          (match, p1) => { return String.fromCharCode(Number('0x' + p1)); }
      ));
    } catch(e) {
      this.msg.error('编码失败');
    }
  }

  decodeBase64(): void {
    if (!this.base64Input) return;
    try {
      this.base64Output = decodeURIComponent(Array.prototype.map.call(atob(this.base64Input),
          (c) => { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }
      ).join(''));
    } catch(e) {
      this.msg.error('解码失败，可能不是有效的 Base64 字符串');
    }
  }

  // --- URL Methods ---
  encodeUrl(): void {
    if (!this.urlInput) return;
    this.urlOutput = encodeURIComponent(this.urlInput);
  }

  decodeUrl(): void {
    if (!this.urlInput) return;
    try {
      this.urlOutput = decodeURIComponent(this.urlInput);
    } catch(e) {
      this.msg.error('解码失败');
    }
  }

  // Utils
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
