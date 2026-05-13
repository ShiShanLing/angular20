import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import {
  CHINA_CENSUS_7TH_DEATH_AGE_MEDIAN_GROUP_MIDPOINT,
  CHINA_CENSUS_7TH_LIFE_EXPECTANCY,
} from './china-longevity.constants';

/** 退休后某一自然年的模拟（先取款、再对剩余本金计息，消费按通胀逐年上调） */
export interface FireYearRow {
  calendarYear: number;
  yearsSinceRetirement: number;
  age: number;
  balanceStart: number;
  annualSpending: number;
  balanceAfterWithdraw: number;
  interestOnRemainder: number;
  balanceEnd: number;
  depletedThisYear: boolean;
  /** 表格「备注」列短标签（首次触发的里程碑才写入） */
  remarkTags: string[];
  /** 备注完整说明，用于悬停提示 */
  milestoneNotes: string[];
}

export interface FireSimSummary {
  /** 退休当年年初入账金额（若已退休则=当前存款） */
  balanceAtRetirement: number;
  yearsPreRetirement: number;
  retirementCalendarYear: number;
  /** 首次不够支付当年消费的年份（含），若无穿仓则为 null */
  depletionCalendarYear: number | null;
  depletionAge: number | null;
  /** 试算最后一年仍为正的年末余额 */
  finalBalanceIfNotDepleted: number | null;
}

const LS_KEY = 'tools_fire_sim_v1';
const MAX_RETIREMENT_YEARS = 85;

/** FIRE 退休模拟：储蓄、提取率、通胀与长寿参数下的逐年资产负债表。 */
@Component({
  selector: 'app-tools-fire',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzInputNumberModule,
    NzGridModule,
    NzAlertModule,
    NzSelectModule,
    NzDividerModule,
    NzTypographyModule,
    NzTagModule,
    NzToolTipModule,
  ],
  templateUrl: './tools-fire.component.html',
  styleUrl: './tools-fire.component.scss',
})
export class ToolsFireComponent implements OnInit {
  form!: FormGroup;
  rows: FireYearRow[] = [];
  summary: FireSimSummary | null = null;

  readonly longevity = CHINA_CENSUS_7TH_LIFE_EXPECTANCY;
  readonly deathMedian = CHINA_CENSUS_7TH_DEATH_AGE_MEDIAN_GROUP_MIDPOINT;
  readonly currentCalendarYear = new Date().getFullYear();
  constructor(private fb: FormBuilder) {}
  
  /**
   * * nz-input-number 在部分浏览器下按回车不会失焦，内部值可能尚未写回 FormControl，
   * 导致 valueChanges / run() 仍用旧值。失焦后会按设计同步并触发重算。
   * 在 form 内按回车可能触发表单默认行为，故阻止默认。社会宣传
   */
  commitFocusedInput(ev: Event): void {
    ev.preventDefault();
    const ae = document.activeElement as HTMLElement | null;
    ae?.blur();
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      gender: ['male'],
      currentSavings: [1_000_000, [Validators.required, Validators.min(0)]],
      nominalReturnPct: [5, [Validators.required, Validators.min(-20), Validators.max(30)]],
      inflationPct: [2.5, [Validators.required, Validators.min(0), Validators.max(30)]],
      /** 退休当年（退休历法年第 1 年）计划年消费，之后每年按通胀乘 (1+π)^k */
      annualSpendingYear1: [120_000, [Validators.required, Validators.min(1)]],
      currentAge: [55, [Validators.required, Validators.min(18), Validators.max(100)]],
      /** 可与当前年龄相同（当年退休）；可小于当前年龄表示已退休试算 */
      retirementAge: [60, [Validators.required, Validators.min(18), Validators.max(100)]],
    });

    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        this.form.patchValue(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }

    this.run();
    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        localStorage.setItem(LS_KEY, JSON.stringify(this.form.value));
      }
      this.run();
    });
  }

  referenceExpectancy(): number {
    return this.form?.value?.gender === 'female'
      ? this.longevity.atBirth.female
      : this.longevity.atBirth.male;
  }

  referenceDeathMedian(): number {
    return this.form?.value?.gender === 'female'
      ? this.deathMedian.female
      : this.deathMedian.male;
  }

  remarkCellText(row: FireYearRow): string {
    return row.remarkTags.length ? row.remarkTags.join('，') : '—';
  }

  remarkTooltip(row: FireYearRow): string {
    return row.milestoneNotes.length ? row.milestoneNotes.join('\n') : '';
  }

  depletionAlertMessage(s: FireSimSummary): string {
    return `按当前假设，约在 ${s.depletionCalendarYear} 年（年龄 ${s.depletionAge} 岁）当年消费将穿仓，账户耗尽或不足。`;
  }

  successAlertMessage(s: FireSimSummary): string {
    const tail = s.finalBalanceIfNotDepleted ?? 0;
    return `在 ${this.rows.length} 年模拟期内未穿仓；末年账面余额约 ¥${tail.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}。`;
  }

  private pushMilestoneOnce(
    tags: string[],
    notes: string[],
    milestonesHit: Set<string>,
    key: string,
    shortTag: string,
    detail: string,
  ): void {
    if (!milestonesHit.has(key)) {
      milestonesHit.add(key);
      tags.push(shortTag);
      notes.push(detail);
    }
  }

  run(): void {
    const v = this.form.getRawValue();
    const pv = Number(v.currentSavings);
    const rPct = Number(v.nominalReturnPct);
    const piPct = Number(v.inflationPct);
    const spend0 = Number(v.annualSpendingYear1);
    const curAge = Number(v.currentAge);
    const retAge = Number(v.retirementAge);

    if (
      !Number.isFinite(pv) ||
      pv < 0 ||
      !(spend0 >= 1) ||
      !Number.isFinite(curAge) ||
      !Number.isFinite(retAge)
    ) {
      this.rows = [];
      this.summary = null;
      return;
    }

    const r = (Number.isFinite(rPct) ? rPct : 0) / 100;
    const pi = (Number.isFinite(piPct) ? piPct : 0) / 100;

    const yearsPre = Math.max(0, Math.round(retAge - curAge));
    const balanceAtRetirement =
      yearsPre > 0 ? pv * Math.pow(1 + r, yearsPre) : pv;
    const retirementCalendarYear = this.currentCalendarYear + yearsPre;

    const gender = v.gender === 'female' ? 'female' : 'male';
    const e0 =
      gender === 'female'
        ? this.longevity.atBirth.female
        : this.longevity.atBirth.male;
    const medDeath =
      gender === 'female' ? this.deathMedian.female : this.deathMedian.male;

    const rows: FireYearRow[] = [];
    let B = balanceAtRetirement;
    let depletionCalendarYear: number | null = null;
    let depletionAge: number | null = null;
    const milestonesHit = new Set<string>();

    for (let k = 0; k < MAX_RETIREMENT_YEARS; k++) {
      const age = retAge + k;
      const calendarYear = retirementCalendarYear + k;
      const annualSpending = spend0 * Math.pow(1 + pi, k);
      const balanceStart = B;

      const remarkTags: string[] = [];
      const milestoneNotes: string[] = [];

      // 整数年龄下：预期寿命非整数，取「首次达到不小于参考值的上取整年龄」
      if (age >= Math.ceil(e0)) {
        this.pushMilestoneOnce(
          remarkTags,
          milestoneNotes,
          milestonesHit,
          'lifeExp',
          '预期寿命参考',
          `已满 ${age} 岁：达到/超过七人普分性别「出生时平均预期寿命」参考（${e0} 岁，0 岁口径）。`,
        );
      }
      // 中位组组中值多带 0.5，里程碑从达到其下取整年龄起提示（与「约落在 70–74 岁组」一致）
      if (age >= Math.floor(medDeath)) {
        this.pushMilestoneOnce(
          remarkTags,
          milestoneNotes,
          milestonesHit,
          'medianDeath',
          '死亡中位组参考',
          `已满 ${age} 岁：达到/超过七普死亡年龄中位组示意（约 ${medDeath} 岁）。`,
        );
      }

      let depletedThisYear = false;
      let balanceAfterWithdraw: number;
      let interestOnRemainder: number;
      let balanceEnd: number;

      if (balanceStart + 1e-6 < annualSpending) {
        depletedThisYear = true;
        balanceAfterWithdraw = balanceStart - annualSpending;
        interestOnRemainder = 0;
        balanceEnd = 0;
        this.pushMilestoneOnce(
          remarkTags,
          milestoneNotes,
          milestonesHit,
          'depleted',
          '穿仓',
          '当年资金不足以覆盖拟定消费，视为穿仓；后续按 0 计。',
        );
        if (depletionCalendarYear === null) {
          depletionCalendarYear = calendarYear;
          depletionAge = age;
        }
      } else {
        balanceAfterWithdraw = balanceStart - annualSpending;
        interestOnRemainder = balanceAfterWithdraw * r;
        balanceEnd = balanceAfterWithdraw * (1 + r);
      }

      rows.push({
        calendarYear,
        yearsSinceRetirement: k,
        age,
        balanceStart,
        annualSpending,
        balanceAfterWithdraw,
        interestOnRemainder,
        balanceEnd,
        depletedThisYear,
        remarkTags,
        milestoneNotes,
      });

      B = balanceEnd;

      if (B < 0.01) {
        if (depletionCalendarYear === null) {
          depletionCalendarYear = calendarYear;
          depletionAge = age;
        }
        break;
      }
    }

    this.rows = rows;
    this.summary = {
      balanceAtRetirement,
      yearsPreRetirement: yearsPre,
      retirementCalendarYear,
      depletionCalendarYear,
      depletionAge,
      finalBalanceIfNotDepleted:
        depletionCalendarYear === null ? B : null,
    };
  }
}
