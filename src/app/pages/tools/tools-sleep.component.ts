import { Component, OnInit } from '@angular/core';
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

interface SleepRecord {
  id: string;
  dateStr: string; 
  sleepTime: string; 
  wakeTime: string;  
  napDuration: number; 
  totalSleep: number; 
}

@Component({
  selector: 'app-tools-sleep',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputNumberModule,
    NzButtonModule, NzDatePickerModule, NzTableModule, 
    NzGridModule, NzStatisticModule
  ],
  providers: [DatePipe],
  templateUrl: './tools-sleep.component.html',
  styleUrl: './tools-sleep.component.scss'
})
export class ToolsSleepComponent implements OnInit {
  form!: FormGroup;
  records: SleepRecord[] = [];
  stats: any = null;

  constructor(private fb: FormBuilder, private msg: NzMessageService, private datePipe: DatePipe) {}

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

      // Upsert
      const existingIdx = this.records.findIndex(r => r.dateStr === dateStr);
      if (existingIdx > -1) {
        this.records[existingIdx] = {
          ...this.records[existingIdx],
          sleepTime: st.toISOString(),
          wakeTime: wt.toISOString(),
          napDuration: val.napDuration || 0,
          totalSleep
        };
      } else {
        this.records.push({
          id: Date.now().toString(),
          dateStr,
          sleepTime: st.toISOString(),
          wakeTime: wt.toISOString(),
          napDuration: val.napDuration || 0,
          totalSleep
        });
      }

      this.records.sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
      
      this.saveRecords();
      this.msg.success('记录成功');
      this.calculateStats();
    }
  }

  deleteRecord(id: string): void {
    this.records = this.records.filter(r => r.id !== id);
    this.saveRecords();
    this.msg.success('删除成功');
    this.calculateStats();
  }

  loadRecords(): void {
    const data = localStorage.getItem('tools_sleep_records');
    if (data) {
      try {
        this.records = JSON.parse(data);
        this.records.sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
      } catch(e) {
        this.records = [];
      }
    }
    this.calculateStats();
  }

  saveRecords(): void {
    localStorage.setItem('tools_sleep_records', JSON.stringify(this.records));
  }

  calculateStats(): void {
    if (!this.records.length) {
      this.stats = null;
      return;
    }

    // "This Week" stats (last 7 recorded days)
    const recent = this.records.slice(0, 7);
    
    let totalDur = 0;
    let earliestSleepTime = 24; // hour of day format
    let earliestSleepLabel = '';
    let latestWakeTime = 0;
    let latestWakeLabel = '';

    recent.forEach(r => {
      totalDur += r.totalSleep;
      
      const st = new Date(r.sleepTime);
      let stHour = st.getHours() + st.getMinutes() / 60;
      // Adjust to make night times comparable. 20:00 - 12:00 next day
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

    this.stats = {
      avgSleep: totalDur / recent.length,
      earliestSleep: earliestSleepLabel,
      latestWake: latestWakeLabel,
      count: recent.length
    };
  }
}
