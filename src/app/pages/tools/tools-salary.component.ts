import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, debounceTime } from 'rxjs';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';

import { RecordService } from '../../services/record.service';

const RECORD_TYPE = 'salary';
const LS_KEY = 'tools_salary_template';

/** 工资个税试算：五险一金扣除与税率阶梯表格。 */
@Component({
  selector: 'app-tools-salary',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzButtonModule, NzSelectModule, NzGridModule, NzStatisticModule, NzDividerModule,
    NzModalModule, NzTableModule
  ],
  templateUrl: './tools-salary.component.html',
  styleUrl: './tools-salary.component.scss'
})
export class ToolsSalaryComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  result: any = null;
  isModalVisible = false;
  monthlyProjection: any[] = [];

  private recordId: number | null = null;
  private sub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private msg: NzMessageService,
    private recordService: RecordService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      grossPay: [10000, [Validators.required, Validators.min(0)]],
      socialBase: [10000, [Validators.required, Validators.min(0)]],
      housingBase: [10000, [Validators.required, Validators.min(0)]],
      housingRatio: [7, [Validators.required, Validators.min(0), Validators.max(100)]],
      specialDeduction: [0, [Validators.min(0)]],
      threshold: [5000, [Validators.required, Validators.min(0)]],
      bonusMonths: [0, [Validators.min(0), Validators.max(24)]],
      monthlyExpense: [0, [Validators.min(0)]]
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

  saveTemplate(showMsg = true): void {
    if (this.form.valid) {
      this.saveToLocalStorage();
      this.saveToApi();
      if (showMsg) this.msg.success('模板已保存');
    }
  }

  calculate(): void {
    const val = this.form.value;
    const gross = val.grossPay || 0;
    const socialBase = val.socialBase || 0;
    const housingBase = val.housingBase || 0;

    const pension = socialBase * 0.08;
    const medical = socialBase * 0.02;
    const unemployment = socialBase * 0.005;
    const socialTotal = pension + medical + unemployment;
    const housing = housingBase * (val.housingRatio / 100);
    const deductions = socialTotal + housing;

    let taxable = gross - deductions - val.threshold - (val.specialDeduction || 0);
    if (taxable < 0) taxable = 0;

    let tax = 0;
    if (taxable <= 3000) tax = taxable * 0.03;
    else if (taxable <= 12000) tax = taxable * 0.1 - 210;
    else if (taxable <= 25000) tax = taxable * 0.2 - 1410;
    else if (taxable <= 35000) tax = taxable * 0.25 - 2660;
    else if (taxable <= 55000) tax = taxable * 0.3 - 4410;
    else if (taxable <= 80000) tax = taxable * 0.35 - 7160;
    else tax = taxable * 0.45 - 15160;

    const netPay = gross - deductions - tax;
    const bonusMonths = val.bonusMonths || 0;
    const monthlyExpense = val.monthlyExpense || 0;
    const annualGross = gross * (12 + bonusMonths);
    const annualNetPay = netPay * (12 + bonusMonths);
    const annualExpenses = monthlyExpense * 12;
    const annualSavings = annualNetPay - annualExpenses;

    this.result = {
      gross, pension, medical, unemployment, housing, deductions,
      taxable, tax, netPay, annualGross, annualNetPay, annualExpenses, annualSavings
    };
    this.updateMonthlyProjection();
  }

  updateMonthlyProjection(): void {
    const val = this.form.value;
    const gross = val.grossPay || 0;
    const socialBase = val.socialBase || 0;
    const housingBase = val.housingBase || 0;

    const pension = socialBase * 0.08;
    const medical = socialBase * 0.02;
    const unemployment = socialBase * 0.005;
    const housing = housingBase * (val.housingRatio / 100);
    const deductions = pension + medical + unemployment + housing;
    const specialDeduction = val.specialDeduction || 0;
    const threshold = val.threshold || 5000;

    let totalTaxSoFar = 0;
    const projection = [];

    for (let i = 1; i <= 12; i++) {
      const cumGross = gross * i;
      const cumDeductions = deductions * i;
      const cumThreshold = threshold * i;
      const cumSpecial = specialDeduction * i;

      let cumTaxable = cumGross - cumDeductions - cumThreshold - cumSpecial;
      if (cumTaxable < 0) cumTaxable = 0;

      let cumTax = 0;
      if (cumTaxable <= 36000) cumTax = cumTaxable * 0.03;
      else if (cumTaxable <= 144000) cumTax = cumTaxable * 0.1 - 2520;
      else if (cumTaxable <= 300000) cumTax = cumTaxable * 0.2 - 16920;
      else if (cumTaxable <= 420000) cumTax = cumTaxable * 0.25 - 31920;
      else if (cumTaxable <= 660000) cumTax = cumTaxable * 0.3 - 52920;
      else if (cumTaxable <= 960000) cumTax = cumTaxable * 0.35 - 85920;
      else cumTax = cumTaxable * 0.45 - 181920;

      const monthTax = cumTax - totalTaxSoFar;
      totalTaxSoFar = cumTax;

      projection.push({
        month: `${i}月`, gross, deductions,
        taxable: cumTaxable / i, tax: monthTax, netPay: gross - deductions - monthTax
      });
    }
    this.monthlyProjection = projection;
  }

  showModal(): void { this.isModalVisible = true; }
  handleCancel(): void { this.isModalVisible = false; }

  // === 持久化 ===

  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem(LS_KEY);
      if (data) this.form.patchValue(JSON.parse(data), { emitEvent: false });
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
