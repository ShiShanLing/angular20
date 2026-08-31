import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { NgxEchartsDirective } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

import { RecordService } from '../../services/record.service';

echarts.use([LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

interface WeightRecord {
  id: number | string;
  date: string;       // YYYY-MM-DD format ideally
  weight: number;     // kg
}

/** 体重记录列表与折线图趋势（服务器持久化）。 */
@Component({
  selector: 'app-tools-weight',
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzButtonModule, NzDatePickerModule, NzTableModule, NzGridModule, NzSpinModule,
    NgxEchartsDirective
  ],
  providers: [DatePipe],
  templateUrl: './tools-weight.component.html',
  styleUrl: './tools-weight.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ToolsWeightComponent implements OnInit {
  private fb = inject(FormBuilder);
  private msg = inject(NzMessageService);
  private datePipe = inject(DatePipe);
  private recordService = inject(RecordService);

  form!: FormGroup;
  readonly records = signal<WeightRecord[]>([]);
  readonly reversedRecords = signal<WeightRecord[]>([]);
  readonly chartOption = signal<EChartsOption>({});
  readonly loading = signal(false);

  // MARK: 初始化 
  // 组件初始化：同步移动端断点、订阅视口变化与路由事件
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

  // MARK: 提交
  submitForm(): void {
    if (this.form.valid) {
      const val = this.form.value;
      const dateStr = this.datePipe.transform(val.date, 'yyyy-MM-dd') || '';
      const existingIdx = this.records().findIndex(r => r.date === dateStr);
      //Optional 本质上是一个枚举,他把可能没值显式的写入的类型系统,避免了OC中的nil类型随时传递照成的运行是问题,对他解包方式有,强制解包,可选解包,空合运算符,可选链.
      //Optional不是普通值,也不是指针,他是类型层面的空值表达.
      //先从判断题和选择题开始. 需要我一个一个设置吗? 还是AI你自己就能搞定?
      if (existingIdx > -1) {
        const existing = this.records()[existingIdx];
        
        this.recordService.update(Number(existing.id), { weight: val.weight }, dateStr).subscribe({
          next: (res) => {
            const updated = this.records().slice();
            updated[existingIdx] = { ...updated[existingIdx], weight: val.weight };
            this.records.set(updated);
            this.reversedRecords.set([...updated].reverse());
            this.msg.success('更新成功');
            this.buildChart();
          },
          error: () => this.msg.error('更新失败')
        });
      } else {
        // 创建新记录-
        this.recordService.create('weight', { weight: val.weight }, dateStr).subscribe({
          next: (res) => {
            const updated = [...this.records(), { id: res.id, date: dateStr, weight: val.weight }];
            updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            this.records.set(updated);
            this.reversedRecords.set([...updated].reverse());
            this.msg.success('记录成功');
            this.buildChart();
          },
          //
          error: () => this.msg.error('保存失败')
        });
      }
    }
  }
  

  // MARK: 删除记录
  deleteRecord(id: number | string): void {
    this.recordService.delete(Number(id)).subscribe({
      next: () => {
        const updated = this.records().filter(r => r.id !== id);
        this.records.set(updated);
        this.reversedRecords.set([...updated].reverse());
        this.msg.success('删除成功');
        this.buildChart();
      },
      error: () => this.msg.error('删除失败')
    });
  }

  // MARK: 加载记录
  loadRecords(): void {
    this.loading.set(true);
    this.recordService.getAll('weight').subscribe({
      next: (apiRecords) => {
        const updated = apiRecords.map(r => ({
          id: r.id,
          date: r.recordDate || r.data?.date || '',
          weight: r.data?.weight || 0,
        }));
        updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        this.records.set(updated);
        this.reversedRecords.set([...updated].reverse());
        this.loading.set(false);
        this.buildChart();
      },
      error: () => {
        this.loading.set(false);
        this.msg.error('加载记录失败');
      }
    });
  }
  
  // MARK: 构建体重曲线
  buildChart(): void {
    const records = this.records();
    if (records.length === 0) {
      this.chartOption.set({});
      return;
    }
    
    const xAxisData = records.map(r => r.date);
    const weightData = records.map(r => r.weight);

    // Calculate 7-day moving average
    const maData = weightData.map((w, idx) => {
      if (idx < 6) return null;
      const slice = weightData.slice(idx - 6, idx + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      return Number((sum / 7).toFixed(2));
    });

    this.chartOption.set({
      tooltip: { trigger: 'axis' },
      legend: { data: ['体重 (kg)', '7日均线'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: xAxisData },
      yAxis: { type: 'value', scale: true, name: 'kg' },
      series: [
        {
          name: '体重 (kg)',
          type: 'line',
          data: weightData,
          itemStyle: { color: '#1890ff' },
          markPoint: { data: [{ type: 'max', name: 'Max' }, { type: 'min', name: 'Min' }] }
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
    });
  }

  // MARK: 导出 
  exportCSV(): void {
    if (!this.records().length) {
      this.msg.warning('没有记录可导出');
      return;
    }
   //
    const headers = ['日期', '体重(kg)'];
    const rows = this.records().map(r => [r.date, r.weight.toString()]);
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
