import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

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
export class ToolsMortgageComponent implements OnInit {
  form!: FormGroup;
  result: any = {
    downPayment: 0,
    gjjPrincipal: 0,
    bizPrincipal: 0,
    gjjMonthly: 0,
    bizMonthly: 0,
    totalMonthly: 0,
    supportMonths: 0,
    supportYearsStr: ''
  };

  constructor(private fb: FormBuilder) { }

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

    this.loadState();
    this.calculate();

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        this.saveState();
        this.calculate();
      }
    });
  }

  calculate(): void {
    const val = this.form.value;
    const housePrice = val.housePrice || 0;
    const downPct = val.downPct || 0;
    const years = val.years || 1;
    const gjjMax = val.gjjMax || 0;
    const gjjRate = val.gjjRate || 0;
    const bizRate = val.bizRate || 0;

    let downPayment = 0;
    let gjjPrincipal = 0;
    let bizPrincipal = 0;

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

    // 二步：对冲撑多久
    const balance = val.gjjBalance || 0;
    const monthlyIn = val.gjjMonthlyIn || 0;
    const supportMonths = this.simulateSupportMonths(balance, monthlyIn, totalMonthly);

    this.result = {
      downPayment,
      gjjPrincipal,
      bizPrincipal,
      gjjMonthly,
      bizMonthly,
      totalMonthly,
      supportMonths,
      supportYearsStr: this.formatMonthsToYears(supportMonths)
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
    while (months < 1200) { // Max 100 years
      b += monthlyIn;
      if (b < monthlyOut) break;
      b -= monthlyOut;
      months++;
    }
    return months;
  }

  private formatMonthsToYears(m: number): string {
    const y = Math.floor(m / 12);
    const r = m % 12;
    return `${y} 年 ${r} 个月`;
  }

  private saveState(): void {
    localStorage.setItem('tools_mortgage_state', JSON.stringify(this.form.value));
  }

  private loadState(): void {
    const saved = localStorage.getItem('tools_mortgage_state');
    if (saved) {
      try {
        this.form.patchValue(JSON.parse(saved), { emitEvent: false });
      } catch (e) { }
    }
  }
}
