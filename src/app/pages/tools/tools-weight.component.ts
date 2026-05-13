import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzMessageService } from 'ng-zorro-antd/message';

import { NgxEchartsDirective } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

interface WeightRecord {
  id: string;
  date: string;       // YYYY-MM-DD format ideally
  weight: number;     // kg
}

/** 体重记录列表与折线图趋势（本地持久化）。 */
@Component({
  selector: 'app-tools-weight',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzButtonModule, NzDatePickerModule, NzTableModule, NzGridModule,
    NgxEchartsDirective
  ],
  providers: [DatePipe],
  templateUrl: './tools-weight.component.html',
  styleUrl: './tools-weight.component.scss'
})
export class ToolsWeightComponent implements OnInit {
  form!: FormGroup;
  records: WeightRecord[] = [];
  reversedRecords: WeightRecord[] = [];
  chartOption: EChartsOption = {};

  constructor(private fb: FormBuilder, private msg: NzMessageService, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      date: [new Date(), [Validators.required]],
      weight: [null, [Validators.required, Validators.min(10), Validators.max(300)]]
    });

    const savedForm = localStorage.getItem('tools_weight_form');
    if (savedForm) {
      try {
        const val = JSON.parse(savedForm);
        if (val.date) val.date = new Date(val.date);
        this.form.patchValue(val);
      } catch (e) {}
    }

    this.form.valueChanges.subscribe(val => {
      localStorage.setItem('tools_weight_form', JSON.stringify(val));
    });

    this.loadRecords();
  }
  
  submitForm(): void {
    if (this.form.valid) {
      const val = this.form.value;
      const dateStr = this.datePipe.transform(val.date, 'yyyy-MM-dd') || '';
      //买iPad 没实际用途啊
      // Override if same date exists
      const existingIdx = this.records.findIndex(r => r.date === dateStr);
      if (existingIdx > -1) {
        this.records[existingIdx].weight = val.weight;
      } else {
        this.records.push({
          id: Date.now().toString(),
          date: dateStr,
          weight: val.weight
        });
      }
      
      // Sort by date ascending for chart
      this.records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      this.reversedRecords = [...this.records].reverse();
      
      this.saveRecords();
      this.msg.success('记录成功');
      this.buildChart();
    }
  }

  deleteRecord(id: string): void {
    this.records = this.records.filter(r => r.id !== id);
    this.reversedRecords = [...this.records].reverse();
    this.saveRecords();
    this.msg.success('删除成功');
    this.buildChart();
  }

  loadRecords(): void {
    const data = localStorage.getItem('tools_weight_records');
    if (data) {
      try {
        this.records = JSON.parse(data);
        this.records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        this.reversedRecords = [...this.records].reverse();
      } catch(e) {
        this.records = [];
        this.reversedRecords = [];
      }
    }
    this.buildChart();
  }

  saveRecords(): void {
    localStorage.setItem('tools_weight_records', JSON.stringify(this.records));
  }

  buildChart(): void {
    if (this.records.length === 0) {
      this.chartOption = {};
      return;
    }

    const xAxisData = this.records.map(r => r.date);
    const weightData = this.records.map(r => r.weight);

    // Calculate 7-day moving average
    const maData = weightData.map((w, idx) => {
      if (idx < 6) return null; // Not enough data for 7-day window
      const slice = weightData.slice(idx - 6, idx + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      return Number((sum / 7).toFixed(2));
    });

    this.chartOption = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['体重 (kg)', '7日均线']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData
      },
      yAxis: {
        type: 'value',
        scale: true,
        name: 'kg'
      },
      series: [
        {
          name: '体重 (kg)',
          type: 'line',
          data: weightData,
          itemStyle: { color: '#1890ff' },
          markPoint: {
            data: [
              { type: 'max', name: 'Max' },
              { type: 'min', name: 'Min' }
            ]
          }
        },
        {
          name: '7日均线',
          type: 'line',
          smooth: true,
          data: maData as any,
          itemStyle: { color: '#52c41a' },
          lineStyle: { type: 'dashed' }
        }
      ]
    };
  }

  exportCSV(): void {
    if (!this.records.length) {
      this.msg.warning('没有记录可导出');
      return;
    }
    const headers = ['日期', '体重(kg)'];
    const rows = this.records.map(r => [r.date, r.weight.toString()]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `weight_trend_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
