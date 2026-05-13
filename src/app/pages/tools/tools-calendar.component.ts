import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NzCalendarModule } from 'ng-zorro-antd/calendar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { FormsModule } from '@angular/forms';

import { LunarUtils } from './lunar.utils';

/** 日历视图 + 农历 `LunarUtils` 标注演示。 */
@Component({
  selector: 'app-tools-calendar',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzCalendarModule, NzBadgeModule, NzCardModule, NzGridModule, NzTagModule
  ],
  templateUrl: './tools-calendar.component.html',
  styleUrl: './tools-calendar.component.scss'
})
export class ToolsCalendarComponent implements OnInit {
  selectedDate = new Date();
  
  // 简易 2026 节假日映射 (Key: YYYY-MM-DD, Value: { name: string, type: 'holiday' | 'work' })
  // 数据来源：国办 2026 放假安排
  holidays2026: any = {
    '2026-01-01': { name: '元旦', type: 'holiday' },
    '2026-01-02': { name: '放假', type: 'holiday' },
    '2026-01-03': { name: '放假', type: 'holiday' },
    '2026-01-04': { name: '补班', type: 'work' },
    '2026-02-15': { name: '春节', type: 'holiday' },
    '2026-02-16': { name: '春节', type: 'holiday' },
    '2026-02-17': { name: '春节', type: 'holiday' },
    '2026-02-18': { name: '春节', type: 'holiday' },
    '2026-02-19': { name: '春节', type: 'holiday' },
    '2026-02-20': { name: '春节', type: 'holiday' },
    '2026-02-21': { name: '春节', type: 'holiday' },
    '2026-02-22': { name: '春节', type: 'holiday' },
    '2026-02-23': { name: '春节', type: 'holiday' },
    '2026-02-08': { name: '补班', type: 'work' },
    '2026-03-01': { name: '补班', type: 'work' },
    '2026-04-04': { name: '清明', type: 'holiday' },
    '2026-04-05': { name: '清明', type: 'holiday' },
    '2026-04-06': { name: '清明', type: 'holiday' },
    '2026-05-01': { name: '劳动节', type: 'holiday' },
    '2026-05-02': { name: '劳动节', type: 'holiday' },
    '2026-05-03': { name: '劳动节', type: 'holiday' },
    '2026-05-04': { name: '劳动节', type: 'holiday' },
    '2026-05-05': { name: '劳动节', type: 'holiday' },
    '2026-04-26': { name: '补班', type: 'work' },
    '2026-05-10': { name: '补班', type: 'work' },
    '2026-06-19': { name: '端午', type: 'holiday' },
    '2026-06-20': { name: '端午', type: 'holiday' },
    '2026-06-21': { name: '端午', type: 'holiday' },
    '2026-09-25': { name: '中秋', type: 'holiday' },
    '2026-09-26': { name: '中秋', type: 'holiday' },
    '2026-09-27': { name: '中秋', type: 'holiday' },
    '2026-09-28': { name: '补班', type: 'work' },
    '2026-10-01': { name: '国庆', type: 'holiday' },
    '2026-10-02': { name: '国庆', type: 'holiday' },
    '2026-10-03': { name: '国庆', type: 'holiday' },
    '2026-10-04': { name: '国庆', type: 'holiday' },
    '2026-10-05': { name: '国庆', type: 'holiday' },
    '2026-10-06': { name: '国庆', type: 'holiday' },
    '2026-10-07': { name: '国庆', type: 'holiday' },
    '2026-10-10': { name: '补班', type: 'work' }
  };

  ngOnInit(): void {}

  prevMonth(): void {
    const d = new Date(this.selectedDate);
    d.setMonth(d.getMonth() - 1);
    this.selectedDate = d;
  }

  nextMonth(): void {
    const d = new Date(this.selectedDate);
    d.setMonth(d.getMonth() + 1);
    this.selectedDate = d;
  }

  getLunarInfo(date: Date): any {
    return LunarUtils.getLunar(date);
  }

  getHolidayInfo(date: Date): any {
    const key = this.formatDate(date);
    return this.holidays2026[key];
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
