import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, debounceTime } from 'rxjs';

import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

import { RecordService } from '../../services/record.service';

interface PensionResult {
  monthlyPension: number;
  accountPart: number;
  paybackMonths: number;
  paybackYears: number;
}

const LS_KEY = 'tools_anhui_rural_pension_v1';
const RECORD_TYPE = 'pension';
const DIVISOR = 139;

/** 安徽城乡居民养老金粗算（个人账户与回本周期展示）。 */
@Component({
  selector: 'app-tools-anhui-pension',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputNumberModule,
    NzGridModule, NzStatisticModule, NzAlertModule
  ],
  templateUrl: './tools-anhui-pension.component.html',
  styleUrl: './tools-anhui-pension.component.scss'
})
export class ToolsAnhuiPensionComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  result: PensionResult | null = null;

  private recordId: number | null = null;
  private sub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private recordService: RecordService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      personalAccountTotal: [null, [Validators.required, Validators.min(0)]],
      basicPension: [200, [Validators.required, Validators.min(0)]]
    });

    this.loadFromLocalStorage();
    if (this.form.valid) this.calculate();
    this.loadFromApi();

    this.sub = this.form.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      if (this.form.valid) {
        this.saveToLocalStorage();
        this.saveToApi();
        this.calculate();
      } else {
        this.result = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  calculate(): void {
    if (this.form.invalid) {
      this.result = null;
      return;
    }

    const v = this.form.getRawValue();
    const personalAccountTotal = Number(v.personalAccountTotal);
    const basicPension = Number(v.basicPension);

    const accountPart = personalAccountTotal / DIVISOR;
    const monthlyPension = accountPart + basicPension;
    const paybackMonths = monthlyPension > 0 ? personalAccountTotal / monthlyPension : 0;
    const paybackYears = paybackMonths / 12;

    this.result = { monthlyPension, accountPart, paybackMonths, paybackYears };
  }

  // === 持久化 ===

  private loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) this.form.patchValue(JSON.parse(saved), { emitEvent: false });
    } catch {}
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(LS_KEY, JSON.stringify(this.form.getRawValue()));
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
    const data = this.form.getRawValue();
    if (this.recordId) {
      this.recordService.update(this.recordId, data).subscribe();
    } else {
      this.recordService.create(RECORD_TYPE, data).subscribe({
        next: (rec) => this.recordId = rec.id
      });
    }
  }
}
