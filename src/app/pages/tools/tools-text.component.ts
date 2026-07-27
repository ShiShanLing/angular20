import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TextFieldModule } from '@angular/cdk/text-field';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

/** 文本工具箱：统计字数、Base64、哈希等快捷操作。 */
@Component({
  selector: 'app-tools-text',
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzInputModule, NzButtonModule, NzSpaceModule,
    NzIconModule, NzDividerModule, NzTooltipModule, TextFieldModule
  ],
  templateUrl: './tools-text.component.html',
  styleUrl: './tools-text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolsTextComponent implements OnInit {
  private readonly msg = inject(NzMessageService);

  readonly sourceText = signal('');

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

  // MARK: 初始化
  // 组件初始化：同步移动端断点、订阅视口变化与路由事件
  ngOnInit(): void {
    const saved = localStorage.getItem('tools_text_content');
    if (saved) {
      this.sourceText.set(saved);
    }
  }

  // MARK: 事件处理
  onSourceTextChange(value: string): void {
    this.sourceText.set(value);
    localStorage.setItem('tools_text_content', value || '');
  }

  // MARK: 复制
  copyToClipboard(): void {
    if (!this.sourceText()) {
      this.msg.warning('文本框为空');
      return;
    }
    navigator.clipboard.writeText(this.sourceText()).then(() => {
      this.msg.success('已复制到剪贴板');
    });
  }

  // MARK: 清空
  clearText(): void {
    this.onSourceTextChange('');
  }

  // MARK: 替换标点
  replacePunctuation(toCn: boolean): void {
    if (!this.sourceText()) return;
    const map = toCn ? this.puncMapEn2Cn : this.puncMapCn2En;
    this.onSourceTextChange(this.sourceText().replace(/./g, char => map[char] || char));
    this.msg.success(toCn ? '已转换为中文标点' : '已转换为英文标点');
  }

  // MARK: 移除
  removeEmptyLines(): void {
    if (!this.sourceText()) return;
    this.onSourceTextChange(this.sourceText().replace(/^\s*[\r\n]/gm, ''));
    this.msg.success('已去除空行');
  }

  // MARK: 添加
  addBatchNumbering(): void {
    if (!this.sourceText()) return;
    const lines = this.sourceText().split('\n');
    let count = 1;
    this.onSourceTextChange(lines.map(line => {
      if (line.trim().length > 0) {
        return `${count++}. ${line}`;
      }
      return line;
    }).join('\n'));
    this.msg.success('已添加序号');
  }

  // MARK: 生成
  generateMarkdownTable(): void {
    if (!this.sourceText()) return;
    // Assuming CSV or Tab separated values
    const lines = this.sourceText().split('\n').filter(l => l.trim().length > 0);
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

    this.onSourceTextChange(table.trim());
    this.msg.success('已生成 Markdown 表格');
  }
}
