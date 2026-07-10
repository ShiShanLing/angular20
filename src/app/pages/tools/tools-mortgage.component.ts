import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, debounceTime } from 'rxjs';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

import { RecordService } from '../../services/record.service';

const RECORD_TYPE = 'mortgage';
const LS_KEY = 'tools_mortgage_state';

/** 房贷月供试算：等额本息 / 等额本金、利率与期限。 */
@Component({
  selector: 'app-tools-mortgage',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzButtonModule, NzSelectModule, NzGridModule, NzStatisticModule, NzDividerModule, NzRadioModule
  ],
  templateUrl: './tools-mortgage.component.html',
  styleUrl: './tools-mortgage.component.scss'
})
export class ToolsMortgageComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  result: any = {
    downPayment: 0, gjjPrincipal: 0, bizPrincipal: 0,
    gjjMonthly: 0, bizMonthly: 0, totalMonthly: 0,
    supportMonths: 0, supportYearsStr: ''
  };

  private recordId: number | null = null;
  private sub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private recordService: RecordService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      housePrice: [1200000, [Validators.required, Validators.min(0)]],
      downPct: [30, [Validators.required, Validators.min(0), Validators.max(100)]],
      years: [30, [Validators.required, Validators.min(1), Validators.max(40)]],
      gjjMax: [700000, [Validators.required, Validators.min(0)]],
      gjjRate: [2.6, [Validators.required, Validators.min(0)]],
      bizRate: [3.2, [Validators.required, Validators.min(0)]],
      plan: ['fullDown', [Validators.required]],
      gjjBalance: [72000, [Validators.min(0)]],
      gjjMonthlyIn: [2000, [Validators.min(0)]]
    });

    // 先从 localStorage 快速恢复（避免白屏）
    this.loadFromLocalStorage();
    this.calculate();

    // 再从 API 加载最新数据覆盖
    this.loadFromApi();

    // 表单变化时：计算 + 保存
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
    const housePrice = val.housePrice || 0;
    const downPct = val.downPct || 0;
    const years = val.years || 1;
    const gjjMax = val.gjjMax || 0;
    const gjjRate = val.gjjRate || 0;
    const bizRate = val.bizRate || 0;

    let downPayment = 0, gjjPrincipal = 0, bizPrincipal = 0;

    if (val.plan === 'fullDown') {
      gjjPrincipal = Math.min(gjjMax, housePrice);
      downPayment = Math.max(0, housePrice - gjjPrincipal);
      bizPrincipal = 0;
    } else {
      downPayment = housePrice * (downPct / 100);
      const needLoan = Math.max(0, housePrice - downPayment);
      gjjPrincipal = Math.min(gjjMax, needLoan);
      bizPrincipal = Math.max(0, needLoan - gjjPrincipal);
    }

    const gjjMonthly = this.calculateEqualPI(gjjPrincipal, gjjRate, years);
    const bizMonthly = this.calculateEqualPI(bizPrincipal, bizRate, years);
    const totalMonthly = gjjMonthly + bizMonthly;

    const balance = val.gjjBalance || 0;
    const monthlyIn = val.gjjMonthlyIn || 0;
    const supportMonths = this.simulateSupportMonths(balance, monthlyIn, totalMonthly);

    this.result = {
      downPayment, bizPrincipal, gjjMonthly, bizMonthly, totalMonthly,
      supportMonths, supportYearsStr: this.formatMonthsToYears(supportMonths)
    };
  }

  private calculateEqualPI(principal: number, annualRatePct: number, years: number): number {
    const P = Math.max(0, principal);
    const n = Math.max(1, Math.floor(years * 12));
    const r = Math.max(0, annualRatePct) / 100 / 12;
    if (P === 0) return 0;
    if (r === 0) return P / n;
    const pow = Math.pow(1 + r, n);
    return P * r * pow / (pow - 1);
  }

  private simulateSupportMonths(balance: number, monthlyIn: number, monthlyOut: number): number {
    if (monthlyOut <= 0) return 999;
    let b = balance;
    let months = 0;
    while (months < 1200) {
      b += monthlyIn;
      if (b < monthlyOut) break;
      b -= monthlyOut;
      months++;
    }
    return months;
  }

  private formatMonthsToYears(m: number): string {
    return `${Math.floor(m / 12)} 年 ${m % 12} 个月`;
  }

  // === 持久化 ===

  private loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) this.form.patchValue(JSON.parse(saved), { emitEvent: false });
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
