import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzMessageService } from 'ng-zorro-antd/message';

import { RecordService } from '../../services/record.service';

interface SleepRecord {
  id: number | string;
  dateStr: string;
  sleepTime: string;
  wakeTime: string;
  napDuration: number;
  totalSleep: number;
}

/** 睡眠记录：入睡/起床时间与时长汇总列表。 */
@Component({
  selector: 'app-tools-sleep',
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputNumberModule,
    NzButtonModule, NzDatePickerModule, NzTableModule,
    NzGridModule, NzStatisticModule
  ],
  providers: [DatePipe],
  templateUrl: './tools-sleep.component.html',
  styleUrl: './tools-sleep.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolsSleepComponent implements OnInit {
  private fb = inject(FormBuilder);
  private msg = inject(NzMessageService);
  private datePipe = inject(DatePipe);
  private recordService = inject(RecordService);

  form!: FormGroup;
  readonly records = signal<SleepRecord[]>([]);
  readonly stats = signal<any>(null);
  readonly loading = signal(false);

  // MARK: 初始化
  // 组件初始化：同步移动端断点、订阅视口变化与路由事件
  ngOnInit(): void {
    const today = new Date();
    const tonight = new Date(today);
    tonight.setHours(23, 30, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 30, 0, 0);

    this.form = this.fb.group({
      recordDate: [today, [Validators.required]],
      sleepTime: [tonight, [Validators.required]],
      wakeTime: [tomorrow, [Validators.required]],
      napDuration: [0.5, [Validators.min(0)]]
    });

    const savedForm = localStorage.getItem('tools_sleep_form');
    if (savedForm) {
      try {
        const val = JSON.parse(savedForm);
        if (val.recordDate) val.recordDate = new Date(val.recordDate);
        if (val.sleepTime) val.sleepTime = new Date(val.sleepTime);
        if (val.wakeTime) val.wakeTime = new Date(val.wakeTime);
        this.form.patchValue(val);
      } catch (e) {}
    }

    this.form.valueChanges.subscribe(val => {
      localStorage.setItem('tools_sleep_form', JSON.stringify(val));
    });

    this.loadRecords();
  }

  // MARK: 提交
  submitForm(): void {
    if (this.form.valid) {
      const val = this.form.value;
      const dateStr = this.datePipe.transform(val.recordDate, 'yyyy-MM-dd') || '';
      const st = new Date(val.sleepTime);
      const wt = new Date(val.wakeTime);

      if (st >= wt) {
        this.msg.error('起床时间必须晚于入睡时间');
        return;
      }

      const diffMs = wt.getTime() - st.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      const totalSleep = diffHrs + (val.napDuration || 0);
      const data = {
        sleepTime: st.toISOString(),
        wakeTime: wt.toISOString(),
        napDuration: val.napDuration || 0,
        totalSleep
      };

      const existingIdx = this.records().findIndex(r => r.dateStr === dateStr);
      if (existingIdx > -1) {
        const existing = this.records()[existingIdx];
        this.recordService.update(Number(existing.id), data, dateStr).subscribe({
          next: () => {
            const updated = this.records().slice();
            updated[existingIdx] = { ...updated[existingIdx], ...data };
            this.records.set(updated);
            this.msg.success('更新成功');
            this.calculateStats();
          },
          error: () => this.msg.error('更新失败')
        });
      } else {
        this.recordService.create('sleep', data, dateStr).subscribe({
          next: (res) => {
            const updated = [...this.records(), { id: res.id, dateStr, ...data }];
            updated.sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
            this.records.set(updated);
            this.msg.success('记录成功');
            this.calculateStats();
          },
          error: () => this.msg.error('保存失败')
        });
      }
    }
  }

  // MARK: 删除记录
  deleteRecord(id: number | string): void {
    this.recordService.delete(Number(id)).subscribe({
      next: () => {
        this.records.set(this.records().filter(r => r.id !== id));
        this.msg.success('删除成功');
        this.calculateStats();
      },
      error: () => this.msg.error('删除失败')
    });
  }

  // MARK: 加载记录
  loadRecords(): void {
    this.loading.set(true);
    this.recordService.getAll('sleep').subscribe({
      next: (apiRecords) => {
        const updated = apiRecords.map(r => ({
          id: r.id,
          dateStr: r.recordDate || r.data?.dateStr || '',
          sleepTime: r.data?.sleepTime || '',
          wakeTime: r.data?.wakeTime || '',
          napDuration: r.data?.napDuration || 0,
          totalSleep: r.data?.totalSleep || 0,
        }));
        updated.sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
        this.records.set(updated);
        this.loading.set(false);
        this.calculateStats();
      },
      error: () => {
        this.loading.set(false);
        this.msg.error('加载记录失败');
      }
    });
  }

  // MARK: 计算
  calculateStats(): void {
    if (!this.records().length) {
      this.stats.set(null);
      return;
    }

    const recent = this.records().slice(0, 7);

    let totalDur = 0;
    let earliestSleepTime = 24;
    let earliestSleepLabel = '';
    let latestWakeTime = 0;
    let latestWakeLabel = '';

    recent.forEach(r => {
      totalDur += r.totalSleep;

      const st = new Date(r.sleepTime);
      let stHour = st.getHours() + st.getMinutes() / 60;
      if (stHour < 12) stHour += 24;

      if (stHour < earliestSleepTime || earliestSleepTime === 24) {
        earliestSleepTime = stHour;
        earliestSleepLabel = this.datePipe.transform(st, 'HH:mm') || '';
      }

      const wt = new Date(r.wakeTime);
      let wtHour = wt.getHours() + wt.getMinutes() / 60;
      if (wtHour > latestWakeTime) {
        latestWakeTime = wtHour;
        latestWakeLabel = this.datePipe.transform(wt, 'HH:mm') || '';
      }
    });

    this.stats.set({
      avgSleep: totalDur / recent.length,
      earliestSleep: earliestSleepLabel,
      latestWake: latestWakeLabel,
      count: recent.length
    });
  }
}
