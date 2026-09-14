import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
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

interface SalaryResult {
  gross: number;
  pension: number;
  medical: number;
  unemployment: number;
  housing: number;
  deductions: number;
  taxable: number;
  tax: number;
  netPay: number;
  bonusMonths: number;
  annualWageGross: number;
  annualBonusGross: number;
  annualGross: number;
  annualWageNet: number;
  annualBonusTax: number;
  annualBonusNet: number;
  annualNetPay: number;
  annualExpenses: number;
  annualSavings: number;
}

/** 工资薪金月度预扣率表，也用于年终奖单独计税（奖金 ÷ 12 找档）。 */
export function monthlyWithholdingTax(taxable: number): number {
  if (taxable <= 0) return 0;
  if (taxable <= 3000) return taxable * 0.03;
  if (taxable <= 12000) return taxable * 0.1 - 210;
  if (taxable <= 25000) return taxable * 0.2 - 1410;
  if (taxable <= 35000) return taxable * 0.25 - 2660;
  if (taxable <= 55000) return taxable * 0.3 - 4410;
  if (taxable <= 80000) return taxable * 0.35 - 7160;
  return taxable * 0.45 - 15160;
}

/** 全年一次性奖金按单独计税：奖金÷12 对照月度税率表。 */
export function annualBonusTax(bonusGross: number): number {
  if (bonusGross <= 0) return 0;
  const rateSlice = bonusGross / 12;
  let rate = 0.03;
  let deduction = 0;
  if (rateSlice > 80000) {
    rate = 0.45;
    deduction = 15160;
  } else if (rateSlice > 55000) {
    rate = 0.35;
    deduction = 7160;
  } else if (rateSlice > 35000) {
    rate = 0.3;
    deduction = 4410;
  } else if (rateSlice > 25000) {
    rate = 0.25;
    deduction = 2660;
  } else if (rateSlice > 12000) {
    rate = 0.2;
    deduction = 1410;
  } else if (rateSlice > 3000) {
    rate = 0.1;
    deduction = 210;
  }
  return Math.max(0, bonusGross * rate - deduction);
}

/** 工资个税试算：五险一金扣除与税率阶梯表格。 */
@Component({
  selector: 'app-tools-salary',
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzButtonModule, NzSelectModule, NzGridModule, NzStatisticModule, NzDividerModule,
    NzModalModule, NzTableModule
  ],
  templateUrl: './tools-salary.component.html',
  styleUrl: './tools-salary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolsSalaryComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly recordService = inject(RecordService);

  form!: FormGroup;
  readonly result = signal<SalaryResult | null>(null);
  readonly isModalVisible = signal(false);
  readonly monthlyProjection = signal<any[]>([]);

  private recordId: number | null = null;
  private sub?: Subscription;

  // MARK: 初始化
  // 组件初始化：同步移动端断点、订阅视口变化与路由事件
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

  // MARK: 销毁清理
  // 取消全部订阅，避免内存泄漏
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // MARK: 保存
  saveTemplate(showMsg = true): void {
    if (this.form.valid) {
      this.saveToLocalStorage();
      this.saveToApi();
      if (showMsg) this.msg.success('模板已保存');
    }
  }

  // MARK: 计算
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

    const tax = monthlyWithholdingTax(taxable);
    const netPay = gross - deductions - tax;
    const bonusMonths = Number(val.bonusMonths) || 0;
    const monthlyExpense = val.monthlyExpense || 0;
    // 年薪只按 12 个月工资；年终奖按「月薪 × 月数」另计，不能并进年薪。
    const annualWageGross = gross * 12;
    const annualBonusGross = gross * bonusMonths;
    const annualGross = annualWageGross + annualBonusGross;
    const annualWageNet = netPay * 12;
    const bonusTax = annualBonusTax(annualBonusGross);
    const annualBonusNet = annualBonusGross - bonusTax;
    const annualNetPay = annualWageNet + annualBonusNet;
    const annualExpenses = monthlyExpense * 12;
    const annualSavings = annualNetPay - annualExpenses;

    this.result.set({
      gross, pension, medical, unemployment, housing, deductions,
      taxable, tax, netPay, bonusMonths,
      annualWageGross, annualBonusGross, annualGross,
      annualWageNet, annualBonusTax: bonusTax, annualBonusNet,
      annualNetPay, annualExpenses, annualSavings
    });
    this.updateMonthlyProjection();
  }

  // MARK: 更新
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
    this.monthlyProjection.set(projection);
  }

  // MARK: 显示
  showModal(): void { this.isModalVisible.set(true); }
  // MARK: 处理
  handleCancel(): void { this.isModalVisible.set(false); }

  // === 持久化 ===

  // MARK: 加载
  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem(LS_KEY);
      if (data) this.form.patchValue(JSON.parse(data), { emitEvent: false });
    } catch {}
  }

  // MARK: 保存
  private saveToLocalStorage(): void {
    localStorage.setItem(LS_KEY, JSON.stringify(this.form.value));
  }

  // MARK: 加载
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

  // MARK: 保存
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
