import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzAlertModule } from 'ng-zorro-antd/alert';

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
export class ToolsSavingComponent implements OnInit {
  form!: FormGroup;
  result: any = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      targetAmount: [100000, [Validators.required, Validators.min(1)]],
      months: [12, [Validators.required, Validators.min(1)]],
      monthlyInvest: [5000, [Validators.required, Validators.min(0)]],
      currentSaved: [10000, [Validators.required, Validators.min(0)]]
    });

    const savedData = localStorage.getItem('tools_saving_form');
    if (savedData) {
      try {
        this.form.patchValue(JSON.parse(savedData));
      } catch (e) {}
    }

    this.calculate();

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        localStorage.setItem('tools_saving_form', JSON.stringify(this.form.value));
        this.calculate();
      }
    });
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
      finishMonths = -1; // impossible
    }

    this.result = {
      target,
      months,
      monthly,
      current,
      finalAmount,
      gap,
      progress,
      requiredMonthly,
      extraMonthly,
      finishMonths
    };
  }
}
