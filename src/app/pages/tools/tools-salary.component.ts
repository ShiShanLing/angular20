import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
export class ToolsSalaryComponent implements OnInit {
  form!: FormGroup;
  result: any = null;
  
  isModalVisible = false;
  monthlyProjection: any[] = [];

  constructor(private fb: FormBuilder, private msg: NzMessageService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      grossPay: [10000, [Validators.required, Validators.min(0)]],
      socialBase: [10000, [Validators.required, Validators.min(0)]],
      housingBase: [10000, [Validators.required, Validators.min(0)]],
      housingRatio: [7, [Validators.required, Validators.min(0), Validators.max(100)]], // %
      specialDeduction: [0, [Validators.min(0)]], // 专项附加扣除
      threshold: [5000, [Validators.required, Validators.min(0)]],
      bonusMonths: [0, [Validators.min(0), Validators.max(24)]], // 年终奖（月数）
      monthlyExpense: [0, [Validators.min(0)]] // 每月其他支出
    });
    this.loadTemplate();
    this.calculate();
    
    // Auto calculate on form changes
    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        this.saveTemplate(false);
        this.calculate();
      }
    });
  }

  saveTemplate(showMsg = true): void {
    if (this.form.valid) {
      localStorage.setItem('tools_salary_template', JSON.stringify(this.form.value));
      if (showMsg) this.msg.success('模板已保存');
    }
  }

  loadTemplate(): void {
    const data = localStorage.getItem('tools_salary_template');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.form.patchValue(parsed, { emitEvent: false });
      } catch (e) {}
    }
  }

  calculate(): void {
    const val = this.form.value;
    const gross = val.grossPay || 0;
    const socialBase = val.socialBase || 0;
    const housingBase = val.housingBase || 0;
    
    // 养老 8%, 医疗 2%, 失业 0.5%
    const pension = socialBase * 0.08;
    const medical = socialBase * 0.02;
    const unemployment = socialBase * 0.005;
    const socialTotal = pension + medical + unemployment;

    // 公积金
    const housing = housingBase * (val.housingRatio / 100);

    const deductions = socialTotal + housing;

    // 计税金额 = 税前 - 五险一金 - 起征点 - 专项扣除
    let taxable = gross - deductions - val.threshold - (val.specialDeduction || 0);
    if (taxable < 0) taxable = 0;

    // 简单算税层级 (此处仅为单月预扣预缴简化版)
    let tax = 0;
    if (taxable <= 3000) tax = taxable * 0.03;
    else if (taxable <= 12000) tax = taxable * 0.1 - 210;
    else if (taxable <= 25000) tax = taxable * 0.2 - 1410;
    else if (taxable <= 35000) tax = taxable * 0.25 - 2660;
    else if (taxable <= 55000) tax = taxable * 0.3 - 4410;
    else if (taxable <= 80000) tax = taxable * 0.35 - 7160;
    else tax = taxable * 0.45 - 15160;

    const netPay = gross - deductions - tax;

    // 年度计算
    const bonusMonths = val.bonusMonths || 0;
    const monthlyExpense = val.monthlyExpense || 0;
    
    const annualGross = gross * (12 + bonusMonths);
    const annualNetPay = netPay * (12 + bonusMonths);
    const annualExpenses = monthlyExpense * 12;
    const annualSavings = annualNetPay - annualExpenses;

    this.result = {
      gross,
      pension,
      medical,
      unemployment,
      housing,
      deductions,
      taxable,
      tax,
      netPay,
      annualGross,
      annualNetPay,
      annualExpenses,
      annualSavings
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

      // Annual cumulative tax brackets
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
        month: `${i}月`,
        gross,
        deductions,
        taxable: cumTaxable / i, // Average taxable for display focus
        tax: monthTax,
        netPay: gross - deductions - monthTax
      });
    }

    this.monthlyProjection = projection;
  }

  showModal(): void {
    this.isModalVisible = true;
  }

  handleCancel(): void {
    this.isModalVisible = false;
  }
}
