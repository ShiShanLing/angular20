import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';

/** 周期性订阅记账：名称、金额与下次扣款日。 */
@Component({
  selector: 'app-tools-subscription',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzButtonModule, NzDatePickerModule, NzSelectModule, NzIconModule
  ],
  providers: [DatePipe],
  templateUrl: './tools-subscription.component.html',
  styleUrl: './tools-subscription.component.scss'
})
export class ToolsSubscriptionComponent implements OnInit {
  form!: FormGroup;
  cycles = [
    { label: '单次', value: 'once' },
    { label: '每月', value: 'monthly' },
    { label: '每季', value: 'quarterly' },
    { label: '每年', value: 'yearly' }
  ];

  constructor(private fb: FormBuilder, private msg: NzMessageService, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      serviceName: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(0)]],
      cycle: ['monthly', [Validators.required]],
      expiryDate: [null, [Validators.required]],
      remarks: ['']
    });

    const savedData = localStorage.getItem('tools_subscription_form');
    if (savedData) {
      try {
        this.form.patchValue(JSON.parse(savedData));
      } catch (e) {}
    }

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        localStorage.setItem('tools_subscription_form', JSON.stringify(this.form.value));
      }
    });
  }

  generateICS(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const val = this.form.value;
    const dtStart = new Date(val.expiryDate);
    // Setting event to morning of expiry
    dtStart.setHours(9, 0, 0, 0);
    const dtEnd = new Date(dtStart.getTime() + 60 * 60 * 1000); // 1 hour duration

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let rrule = '';
    if (val.cycle === 'monthly') rrule = 'RRULE:FREQ=MONTHLY\r\n';
    else if (val.cycle === 'quarterly') rrule = 'RRULE:FREQ=MONTHLY;INTERVAL=3\r\n';
    else if (val.cycle === 'yearly') rrule = 'RRULE:FREQ=YEARLY\r\n';

    const uid = Date.now().toString() + '@angular20.local';
    const stamp = formatICSDate(new Date());

    const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Angular20//Tools//CN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${stamp}
DTSTART:${formatICSDate(dtStart)}
DTEND:${formatICSDate(dtEnd)}
${rrule}SUMMARY:订阅到期提醒: ${val.serviceName}
DESCRIPTION:【${val.serviceName}】即将到期或扣费。\\n金额: ¥${val.amount}\\n周期: ${this.cycles.find(c => c.value === val.cycle)?.label}\\n备注: ${val.remarks}
BEGIN:VALARM
TRIGGER:-PT1D
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `subscription_${val.serviceName}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.msg.success('ICS 文件已导出，请导入到系统日历');
  }
}
