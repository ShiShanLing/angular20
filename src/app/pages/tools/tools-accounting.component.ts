import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { NgxEchartsDirective } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([PieChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface AccountingRecord {
  id: string;
  amount: number;
  category: string;
  remarks: string;
  date: string;
}

@Component({
  selector: 'app-tools-accounting',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzSelectModule, NzButtonModule, NzDatePickerModule,
    NzTableModule, NzTabsModule, NzGridModule, NzTagModule,
    NgxEchartsDirective
  ],
  providers: [DatePipe],
  templateUrl: './tools-accounting.component.html',
  styleUrl: './tools-accounting.component.scss'
})
export class ToolsAccountingComponent implements OnInit {
  form!: FormGroup;
  categories = ['餐饮', '交通', '购物', '居住', '娱乐', '医疗', '其他'];
  records: AccountingRecord[] = [];
  
  chartOption: EChartsOption = {};
  currentChartMode: 'week' | 'month' = 'week';

  constructor(private fb: FormBuilder, private msg: NzMessageService, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      category: ['餐饮', [Validators.required]],
      remarks: [''],
      date: [new Date(), [Validators.required]]
    });

    const savedForm = localStorage.getItem('tools_accounting_form');
    if (savedForm) {
      try {
        const val = JSON.parse(savedForm);
        if (val.date) val.date = new Date(val.date);
        this.form.patchValue(val);
      } catch (e) {}
    }

    this.form.valueChanges.subscribe(val => {
      localStorage.setItem('tools_accounting_form', JSON.stringify(val));
    });

    this.loadRecords();
    setTimeout(() => this.buildChart(this.currentChartMode), 100);
  }

  
  submitForm(): void {
    if (this.form.valid) {
      const val = this.form.value;
      const newRecord: AccountingRecord = {
        id: Date.now().toString(),
        amount: val.amount,
        category: val.category,
        remarks: val.remarks,
        date: val.date.toISOString()
      };
      this.records.unshift(newRecord);
      this.saveRecords();
      this.msg.success('记录成功');
      
      this.form.patchValue({
        amount: null,
        remarks: '',
        date: new Date()
      });
      this.buildChart(this.currentChartMode);
    }
  }

  deleteRecord(id: string): void {
    this.records = this.records.filter(r => r.id !== id);
    this.saveRecords();
    this.msg.success('删除成功');
    this.buildChart(this.currentChartMode);
  }

  loadRecords(): void {
    const data = localStorage.getItem('tools_accounting_records');
    if (data) {
      try {
        this.records = JSON.parse(data);
      } catch(e) {
        this.records = [];
      }
    }
  }

  saveRecords(): void {
    localStorage.setItem('tools_accounting_records', JSON.stringify(this.records));
  }

  buildChart(mode: 'week' | 'month'): void {
    this.currentChartMode = mode;
    const now = new Date();
    
    // Filter records based on mode
    const filteredRecords = this.records.filter(r => {
      const d = new Date(r.date);
      if (mode === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else {
        // week logic: roughly within last 7 days for simplicity, or strict this week check
        // For strict week: get Monday of this week
        const day = now.getDay() || 7;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
        return d >= monday;
      }
    });

    const categorySum: Record<string, number> = {};
    filteredRecords.forEach(r => {
      categorySum[r.category] = (categorySum[r.category] || 0) + r.amount;
    });

    const pieData = Object.keys(categorySum).map(k => ({ name: k, value: Number(categorySum[k].toFixed(2)) })).sort((a,b) => b.value - a.value);

    this.chartOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : ¥{c} ({d}%)'
      },
      legend: {
        bottom: 10,
        left: 'center'
      },
      series: [
        {
          name: '消费金额',
          type: 'pie',
          radius: '50%',
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  }

  exportCSV(): void {
    if (!this.records.length) {
      this.msg.warning('没有记录可导出');
      return;
    }
    const headers = ['时间', '分类', '金额', '备注'];
    const rows = this.records.map(r => [
      this.datePipe.transform(r.date, 'yyyy-MM-dd HH:mm:ss') || '',
      r.category,
      r.amount.toString(),
      r.remarks.replace(/,/g, '，') // avoid csv comma collision
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `accounting_records_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
