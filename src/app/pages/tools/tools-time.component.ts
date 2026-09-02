import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

/** 时间效率工具：待办清单、番茄钟相关能力与表单（见页面文案）。 */
@Component({
  selector: 'app-tools-time',
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzButtonModule, NzDatePickerModule, NzGridModule, NzStatisticModule, NzDividerModule,
    NzListModule, NzCheckboxModule, NzSelectModule, NzIconModule, NzModalModule
  ],
  templateUrl: './tools-time.component.html',
  styleUrl: './tools-time.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolsTimeComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // Pomodoro
  readonly pomoMode = signal<'work' | 'break' | 'longBreak'>('work');
  readonly pomoRound = signal(1);
  readonly pomoRemainingSec = signal(25 * 60);
  readonly pomoIsRunning = signal(false);
  pomoTimerId: ReturnType<typeof setInterval> | null = null;
  private deadlineTimerId: ReturnType<typeof setInterval> | null = null;
  private readonly subs = new Subscription();
  private originalTitle = '';

  // Todo
  readonly todoList = signal<TodoItem[]>([]);
  readonly newTodoText = signal('');

  // Deadline
  deadlineForm!: FormGroup;
  readonly scheduleResult = signal<any>({
    countdownStr: '-',
    remainHours: 0,
    remainDays: 0,
    needPerHour: 0,
    feasible: '-'
  });

  // MARK: 初始化
  // 组件初始化：同步移动端断点、订阅视口变化与路由事件
  ngOnInit(): void {
    this.originalTitle = document.title;
    this.deadlineForm = this.fb.group({
      deadline: [null],
      totalHours: [40, [Validators.min(0)]],
      doneHours: [0, [Validators.min(0)]],
      hoursPerDay: [2, [Validators.min(0)]],
      workdaysOnly: ['no']
    });
    this.loadAllStates();
    this.setPomoMode('work');
    this.subs.add(
      this.deadlineForm.valueChanges.subscribe(() => {
        this.saveDeadlineState();
        this.computeSchedule();
      })
    );
    //
    // Simple countdown timer for UI
    this.deadlineTimerId = setInterval(() => this.computeSchedule(), 1000);
  }

  // MARK: 销毁清理
  // 取消全部订阅，避免内存泄漏
  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.pomoTimerId !== null) clearInterval(this.pomoTimerId);
    if (this.deadlineTimerId !== null) clearInterval(this.deadlineTimerId);
    document.title = this.originalTitle;
  }

  // --- Pomodoro Logic ---
  // MARK: 设置
  setPomoMode(mode: 'work' | 'break' | 'longBreak'): void {
    this.pomoMode.set(mode);
    const settings = this.getPomoSettings();
    const mins = mode === 'work' ? settings.work : (mode === 'break' ? settings.break : settings.long);
    this.pomoRemainingSec.set(mins * 60);
    this.updateTitle();
  }

  // MARK: 获取
  getPomoSettings() {
    return { work: 25, break: 5, long: 15, longEvery: 4 };
  }

  // MARK: 切换
  togglePomo(): void {
    if (this.pomoIsRunning()) {
      this.pausePomo();
    } else {
      this.startPomo();
    }
  }

  // MARK: 开始 
  startPomo(): void {
    this.pomoIsRunning.set(true);
    this.pomoTimerId = setInterval(() => {
      if (this.pomoRemainingSec() > 0) {
        this.pomoRemainingSec.update(v => v - 1);
        this.updateTitle();
      } else {
        this.pausePomo();
        this.onPomoFinished();
      }
    }, 1000);
  }

  // MARK: 暂停
  pausePomo(): void {
    this.pomoIsRunning.set(false);
    if (this.pomoTimerId) {
      clearInterval(this.pomoTimerId);
      this.pomoTimerId = null;
    }
  }

  // MARK: 重置
  resetPomo(): void {
    this.pausePomo();
    this.pomoRound.set(1);
    this.setPomoMode('work');
  }

  // MARK: 下个番茄
  nextPomo(): void {
    this.pausePomo();
    const settings = this.getPomoSettings();
    if (this.pomoMode() === 'work') {
      const useLong = (this.pomoRound() % settings.longEvery === 0);
      this.setPomoMode(useLong ? 'longBreak' : 'break');
    } else {
      this.pomoRound.update(v => v + 1);
      this.setPomoMode('work');
    }
  }
  
  // MARK: 事件处理
  onPomoFinished(): void {
    const label = this.pomoMode() === 'work' ? '工作' : '休息';
    this.modal.info({
      nzTitle: `${label}结束`,
      nzContent: `一段${label}已完成，点击确定进入下一阶段。`,
      nzOnOk: () => this.nextPomo()
    });
  }
  
  // MARK: 更新
  updateTitle(): void {
    const mm = Math.floor(this.pomoRemainingSec() / 60);
    const ss = this.pomoRemainingSec() % 60;
    const timeStr = `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
    const label = this.pomoMode() === 'work' ? '工作' : '休息';
    // Accessing document globally is acceptable in Angular for title updates
    document.title = `${timeStr} - ${label}`;
  }
  //
  // MARK: 格式化
  formatTime(sec: number): string {
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  }

  // --- Todo Logic ---
  // MARK: 获取
  getTodayKey(): string {
    const d = new Date();
    return `todo-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }
  
  // MARK: 添加
  addTodo(): void {
    if (!this.newTodoText().trim()) return;
    this.todoList.update(list => [{
      id: Date.now().toString(),
      text: this.newTodoText().trim(),
      done: false
    }, ...list]);
    this.newTodoText.set('');
    this.saveTodoState();
  }

  // MARK: 删除
  deleteTodo(id: string): void {
    this.todoList.update(list => list.filter(t => t.id !== id));
    this.saveTodoState();
  }

  // MARK: 切换
  toggleTodo(item: TodoItem): void {
    this.todoList.update(list => list.map(t => t.id === item.id ? { ...t, done: !t.done } : t));
    this.saveTodoState();
  }

  // MARK: 清空
  clearDoneTodos(): void {
    this.todoList.update(list => list.filter(t => !t.done));
    this.saveTodoState();
  }

  // --- Deadline Logic ---
  // MARK: 计算
  computeSchedule(): void {
    const val = this.deadlineForm.value;
    const remain = Math.max(0, (val.totalHours || 0) - (val.doneHours || 0));

    if (!val.deadline) {
      this.scheduleResult.set({ countdownStr: '-', remainHours: remain, remainDays: 0, needPerHour: 0, feasible: '-' });
      return;
    }

    const target = new Date(val.deadline);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();

    if (diffMs < 0) {
      this.scheduleResult.set({ countdownStr: '已到期', remainHours: remain, remainDays: 0, needPerHour: remain > 0 ? 999 : 0, feasible: '来不及' });
      return;
    }

    const daysAvail = this.countAvailableDays(now, target, val.workdaysOnly === 'yes');
    const needPerDay = daysAvail > 0 ? remain / daysAvail : (remain > 0 ? 999 : 0);
    
    this.scheduleResult.set({
      countdownStr: this.formatCountdown(diffMs),
      remainHours: remain,
      remainDays: daysAvail,
      needPerHour: needPerDay,
      feasible: (val.hoursPerDay >= needPerDay) ? '来得及' : '可能有压力'
    });
  }

  // MARK: 可用天数
  private countAvailableDays(from: Date, to: Date, workdaysOnly: boolean): number {
    let count = 0;
    const cur = new Date(from.getTime());
    cur.setHours(0, 0, 0, 0);
    const end = new Date(to.getTime());
    end.setHours(0, 0, 0, 0);

    while (cur.getTime() < end.getTime()) {
      const day = cur.getDay();
      if (!workdaysOnly || (day >= 1 && day <= 5)) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }
  
  // MARK: 格式化
  private formatCountdown(ms: number): string {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${d}天 ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  // --- Persistence ---
  // MARK: 保存
  private saveTodoState(): void {
    localStorage.setItem(this.getTodayKey(), JSON.stringify(this.todoList()));
  }

  // MARK: 保存
  private saveDeadlineState(): void {
    localStorage.setItem('tools_time_deadline_state', JSON.stringify(this.deadlineForm.value));
  }

  // MARK: 加载
  private loadAllStates(): void {
    // Load Todos
    const savedTodos = localStorage.getItem(this.getTodayKey());
    if (savedTodos) this.todoList.set(JSON.parse(savedTodos));

    // Load Deadline
    const savedDeadline = localStorage.getItem('tools_time_deadline_state');
    if (savedDeadline) {
      try {
        const parsed = JSON.parse(savedDeadline);
        if (parsed.deadline) parsed.deadline = new Date(parsed.deadline);
        this.deadlineForm.patchValue(parsed, { emitEvent: false });
      } catch (e) {}
    }
  }
}
