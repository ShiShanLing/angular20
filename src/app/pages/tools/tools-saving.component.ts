import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, debounceTime } from 'rxjs';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzAlertModule } from 'ng-zorro-antd/alert';

import { RecordService } from '../../services/record.service';

const RECORD_TYPE = 'saving';
const LS_KEY = 'tools_saving_form';

/** 存钱目标与定投进度条展示。 */
@Component({
  selector: 'app-tools-saving',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzButtonModule, NzGridModule, NzProgressModule, NzStatisticModule, NzAlertModule
  ],
  templateUrl: './tools-saving.component.html',
  styleUrl: './tools-saving.component.scss'
})
export class ToolsSavingComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  result: any = null;

  private recordId: number | null = null;
  private sub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private recordService: RecordService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      targetAmount: [100000, [Validators.required, Validators.min(1)]],
      months: [12, [Validators.required, Validators.min(1)]],
      monthlyInvest: [5000, [Validators.required, Validators.min(0)]],
      currentSaved: [10000, [Validators.required, Validators.min(0)]]
    });

    this.loadFromLocalStorage();
    this.calculate();
    this.loadFromApi();

    this.sub = this.form.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      if (this.form.valid) {
        this.saveToLocalStorage();
        this.saveToApi();
        this.calculate();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  calculate(): void {
    const val = this.form.value;
    const target = val.targetAmount;
    const months = val.months;
    const monthly = val.monthlyInvest;
    const current = val.currentSaved;

    const finalAmount = current + (monthly * months);
    const gap = target - finalAmount;
    let progress = (finalAmount / target) * 100;
    if (progress > 100) progress = 100;

    const requiredMonthly = (target - current) / months;
    const extraMonthly = requiredMonthly > monthly ? requiredMonthly - monthly : 0;

    let finishMonths = 0;
    if (monthly > 0) {
      finishMonths = Math.ceil((target - current) / monthly);
    } else if (current >= target) {
      finishMonths = 0;
    } else {
      finishMonths = -1;
    }

    this.result = {
      target, months, monthly, current, finalAmount, gap,
      progress, requiredMonthly, extraMonthly, finishMonths
    };
  }

  // === 持久化 ===

  private loadFromLocalStorage(): void {
    try {
      const savedData = localStorage.getItem(LS_KEY);
      if (savedData) this.form.patchValue(JSON.parse(savedData), { emitEvent: false });
    } catch {}
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(LS_KEY, JSON.stringify(this.form.value));
  }

  private loadFromApi(): void {
    this.recordService.getAll(RECORD_TYPE).subscribe({
      next: (records) => {
        if (records.length > 0) {
          const rec = records[0];
          this.recordId = rec.id;
          const data = typeof rec.data === 'string' ? JSON.parse(rec.data) : rec.data;
          this.form.patchValue(data, { emitEvent: false });
          this.calculate();
        }
      }
    });
  }

  private saveToApi(): void {
    const data = this.form.value;
    if (this.recordId) {
      this.recordService.update(this.recordId, data).subscribe();
    } else {
      this.recordService.create(RECORD_TYPE, data).subscribe({
        next: (rec) => this.recordId = rec.id
      });
    }
  }
}
