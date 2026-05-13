import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

interface PensionResult {
  monthlyPension: number;
  accountPart: number;
  paybackMonths: number;
  paybackYears: number;
}

const LS_KEY = 'tools_anhui_rural_pension_v1';
const DIVISOR = 139;

/** 安徽城乡居民养老金粗算（个人账户与回本周期展示）。 */
@Component({
  selector: 'app-tools-anhui-pension',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzInputNumberModule,
    NzGridModule,
    NzStatisticModule,
    NzAlertModule
  ],
  templateUrl: './tools-anhui-pension.component.html',
  styleUrl: './tools-anhui-pension.component.scss'
})
export class ToolsAnhuiPensionComponent implements OnInit {
  form!: FormGroup;
  result: PensionResult | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      personalAccountTotal: [null, [Validators.required, Validators.min(0)]],
      basicPension: [200, [Validators.required, Validators.min(0)]]
    });

    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        this.form.patchValue(JSON.parse(saved), { emitEvent: false });
      } catch {
        // ignore invalid local data
      }
    }

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        localStorage.setItem(LS_KEY, JSON.stringify(this.form.getRawValue()));
        this.calculate();
      } else {
        this.result = null;
      }
    });

    if (this.form.valid) {
      this.calculate();
    }
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

    this.result = {
      monthlyPension,
      accountPart,
      paybackMonths,
      paybackYears
    };
  }
}
