import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';

/** BMI、体脂估算与健康区间提示（含本地草稿缓存）。 */
@Component({
  selector: 'app-tools-bmi',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputNumberModule, NzRadioModule,
    NzStatisticModule, NzGridModule, NzDividerModule, NzTagModule, NzIconModule
  ],
  templateUrl: './tools-bmi.component.html',
  styleUrl: './tools-bmi.component.scss'
})
export class ToolsBmiComponent implements OnInit {
  form!: FormGroup;
  result: any = {
    bmi: 0,
    category: '-',
    categoryColor: 'default',
    bodyFat: 0
  };

  constructor(private fb: FormBuilder) {}
  
  ngOnInit(): void {
    this.form = this.fb.group({
      height: [170, [Validators.required, Validators.min(50), Validators.max(250)]],
      weight: [65, [Validators.required, Validators.min(10), Validators.max(300)]],
      age: [30, [Validators.required, Validators.min(1), Validators.max(120)]],
      sex: ['male', [Validators.required]]
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
    const hM = val.height / 100;
    const bmi = val.weight / (hM * hM);
    // Deurenberg formula: BF% = 1.20*BMI + 0.23*Age - 10.8*Sex - 5.4, Sex=1 male, 0 female
    const sexFlag = val.sex === 'male' ? 1 : 0;
    const bf = 1.2 * bmi + 0.23 * val.age - 10.8 * sexFlag - 5.4;

    const catInfo = this.getBmiCategory(bmi);

    this.result = {
      bmi,
      category: catInfo.text,
      categoryColor: catInfo.color,
      bodyFat: bf
    };
  }

  private getBmiCategory(bmi: number): { text: string; color: string } {
    if (bmi < 18.5) return { text: '偏瘦', color: 'warning' };
    if (bmi < 25) return { text: '正常', color: 'success' };
    if (bmi < 30) return { text: '超重', color: 'orange' };
    return { text: '肥胖', color: 'error' };
  }

  private saveState(): void {
    localStorage.setItem('tools_bmi_state', JSON.stringify(this.form.getRawValue()));
  }

  private loadState(): void {
    const saved = localStorage.getItem('tools_bmi_state');
    if (saved) {
      try {
        this.form.patchValue(JSON.parse(saved), { emitEvent: false });
      } catch (e) {}
    }
  }
}
