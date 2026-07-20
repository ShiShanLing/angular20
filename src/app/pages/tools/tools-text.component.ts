import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

/** 文本工具箱：统计字数、Base64、哈希等快捷操作。 */
@Component({
  selector: 'app-tools-text',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzInputModule, NzButtonModule, NzSpaceModule,
    NzIconModule, NzDividerModule, NzToolTipModule
  ],
  templateUrl: './tools-text.component.html',
  styleUrl: './tools-text.component.scss'
})
export class ToolsTextComponent implements OnInit {
  _sourceText: string = '';

  get sourceText(): string {
    return this._sourceText;
  }
  
  set sourceText(val: string) {
    this._sourceText = val;
    localStorage.setItem('tools_text_content', val || '');
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('tools_text_content');
    if (saved) {
      this._sourceText = saved;
    }
  }

  private readonly puncMapEn2Cn: Record<string, string> = {
    ',': '，', '.': '。', '?': '？', '!': '！', ':': '：', ';': '；',
    '(': '（', ')': '）', '[': '【', ']': '】', '<': '《', '>': '》',
    '"': '”', "'": "’"
  };

  private readonly puncMapCn2En: Record<string, string> = {
    '，': ',', '。': '.', '？': '?', '！': '!', '：': ':', '；': ';',
    '（': '(', '）': ')', '【': '[', '】': ']', '《': '<', '》': '>',
    '“': '"', '”': '"', '‘': "'", '’': "'"
  };

  constructor(private msg: NzMessageService) {}

  copyToClipboard(): void {
    if (!this.sourceText) {
      this.msg.warning('文本框为空');
      return;
    }
    navigator.clipboard.writeText(this.sourceText).then(() => {
      this.msg.success('已复制到剪贴板');
    });
  }

  clearText(): void {
    this.sourceText = '';
  }

  replacePunctuation(toCn: boolean): void {
    if (!this.sourceText) return;
    const map = toCn ? this.puncMapEn2Cn : this.puncMapCn2En;
    this.sourceText = this.sourceText.replace(/./g, char => map[char] || char);
    this.msg.success(toCn ? '已转换为中文标点' : '已转换为英文标点');
  }

  removeEmptyLines(): void {
    if (!this.sourceText) return;
    this.sourceText = this.sourceText.replace(/^\s*[\r\n]/gm, '');
    this.msg.success('已去除空行');
  }

  addBatchNumbering(): void {
    if (!this.sourceText) return;
    const lines = this.sourceText.split('\n');
    let count = 1;
    this.sourceText = lines.map(line => {
      if (line.trim().length > 0) {
        return `${count++}. ${line}`;
      }
      return line;
    }).join('\n');
    this.msg.success('已添加序号');
  }

  generateMarkdownTable(): void {
    if (!this.sourceText) return;
    // Assuming CSV or Tab separated values
    const lines = this.sourceText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      this.msg.warning('请输入有效数据');
      return;
    }
    
    const parseLine = (line: string) => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes(',')) return line.split(',');
      return line.split(/\s+/);
    };

    const parsedData = lines.map(parseLine);
    const colCount = Math.max(...parsedData.map(r => r.length));

    let table = '';
    parsedData.forEach((row, i) => {
      // pad row
      while (row.length < colCount) row.push('');
      table += '| ' + row.join(' | ') + ' |\n';
      
      if (i === 0) {
        table += '|' + Array(colCount).fill('---').join('|') + '|\n';
      }
    });

    this.sourceText = table.trim();
    this.msg.success('已生成 Markdown 表格');
  }
}
