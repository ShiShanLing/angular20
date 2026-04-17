import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, formatDate } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageModule } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-tools-water',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzButtonModule, NzDatePickerModule, NzGridModule, NzStatisticModule, NzDividerModule,
    NzAlertModule, NzIconModule, NzMessageModule
  ],
  templateUrl: './tools-water.component.html',
  styleUrl: './tools-water.component.scss'
})
export class ToolsWaterComponent implements OnInit {
  form!: FormGroup;
  result: any = {
    timesPerDay: 0,
    plannedMl: 0,
    diff: 0,
    status: 'info',
    hint: ''
  };

  constructor(private fb: FormBuilder, private message: NzMessageService) {}

  ngOnInit(): void {
    const today = new Date();
    this.form = this.fb.group({
      goal: [2000, [Validators.required, Validators.min(0)]],
      per: [250, [Validators.required, Validators.min(0)]],
      startDate: [today, [Validators.required]],
      days: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
      timeList: ['09:30\n11:00\n14:00\n16:00\n18:30', [Validators.required]],
      tzid: ['Asia/Shanghai', [Validators.required]]
    });

    this.loadState();
    this.computePlan();

    this.form.valueChanges.subscribe(() => {
      this.saveState();
      this.computePlan();
    });
  }

  computePlan(): void {
    const val = this.form.value;
    const times = this.parseTimeLines(val.timeList);
    const planned = (val.per || 0) * times.length;
    const diff = planned - (val.goal || 0);

    let status: 'success' | 'info' | 'warning' | 'error' = 'info';
    let hint = '';

    if (val.goal <= 0 || times.length === 0 || val.per <= 0) {
      status = 'warning';
      hint = '请设置目标、单次量和提醒时间';
      
    } else {
      if (Math.abs(diff) < 1) {
        status = 'success';
        hint = '计划完美达成目标！';
      } else if (diff > 0) {
        status = 'success';
        hint = `计划比目标多出 ${diff}ml，非常充沛。`;
      } else {
        status = 'warning';
        hint = `比目标少 ${-diff}ml，建议增加次数或单次量。`;
      }
    }
    
    this.result = {
      timesPerDay: times.length,
      plannedMl: planned,
      diff,
      status,
      hint
    };
  }

  downloadIcs(): void {
    const { ok, error, ics } = this.buildIcs();
    if (!ok) {
      this.message.error(error);
      return;
    }
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `water-reminders-${formatDate(new Date(), 'yyyyMMdd', 'en')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    this.message.success('已导出日历提醒文件');
  }

  private parseTimeLines(text: string): { hh: number; mm: number; raw: string }[] {
    const lines = (text || '').split(/\n/).map(s => s.trim()).filter(Boolean);
    const times: any[] = [];
    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length !== 2) continue;
      const hh = parseInt(parts[0], 10);
      const mm = parseInt(parts[1], 10);
      if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) continue;
      times.push({ hh, mm, raw: `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}` });
    }
    // Uniq and sort
    const uniq = Array.from(new Set(times.map(t => t.raw))).map(raw => {
      const [h, m] = raw.split(':').map(Number);
      return { hh: h, mm: m, raw };
    });
    return uniq.sort((a, b) => (a.hh * 60 + a.mm) - (b.hh * 60 + b.mm));
  }

  private buildIcs(): { ok: boolean; error: string; ics: string } {
    const val = this.form.value;
    const times = this.parseTimeLines(val.timeList);
    if (!val.startDate || times.length === 0 || !val.per) {
      return { ok: false, error: '请先填写完整参数', ics: '' };
    }

    const start = new Date(val.startDate);
    const days = val.days || 30;
    const tzid = val.tzid;
    const nowStampUtc = formatDate(new Date(), "yyyyMMdd'T'HHmmss'Z'", 'en', 'UTC');

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Water Reminder//CN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    let uidCounter = 0;
    for (let dayIdx = 0; dayIdx < days; dayIdx++) {
      const cur = new Date(start.getTime());
      cur.setDate(start.getDate() + dayIdx);
      const hostYmd = formatDate(cur, 'yyyyMMdd', 'en');

      for (const t of times) {
        uidCounter++;
        const dtStartLocal = `${hostYmd}T${t.hh.toString().padStart(2, '0')}${t.mm.toString().padStart(2, '0')}00`;
        const end = new Date(cur.getTime());
        end.setHours(t.hh, t.mm + 5); // 5 min duration
        const dtEndLocal = formatDate(end, "yyyyMMdd'T'HHmmss", 'en');

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:water-${hostYmd}-${t.hh}${t.mm}-${uidCounter}@angular-demo`);
        lines.push(`DTSTAMP:${nowStampUtc}`);
        lines.push(`SUMMARY:喝水提醒 (${val.per}ml)`);
        lines.push(`DESCRIPTION:记得喝水哦，本次目标 ${val.per}ml。`);
        lines.push(`DTSTART;TZID=${tzid}:${dtStartLocal}`);
        lines.push(`DTEND;TZID=${tzid}:${dtEndLocal}`);
        lines.push('END:VEVENT');
      }
    }

    lines.push('END:VCALENDAR');
    return { ok: true, error: '', ics: lines.join('\r\n') };
  }

  private saveState(): void {
    localStorage.setItem('tools_water_state', JSON.stringify(this.form.getRawValue()));
  }

  private loadState(): void {
    const saved = localStorage.getItem('tools_water_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
        this.form.patchValue(parsed, { emitEvent: false });
      } catch (e) {}
    }
  }
}
