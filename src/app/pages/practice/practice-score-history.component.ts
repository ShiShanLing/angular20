import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import {
  PRACTICE_HISTORY_TRACK_LABELS,
  PracticeStorageService,
  type PracticeHistoryTrack,
} from './practice-storage.service';
import { buildScoreTrendOption } from './practice-score-trend.util';

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

function readHistoryTrack(route: ActivatedRoute): PracticeHistoryTrack {
  const track = route.snapshot.data['practiceHistoryTrack'];
  if (track === 'ios' || track === 'android' || track === 'angular' || track === 'ts' || track === 'practice') {
    return track;
  }
  return 'practice';
}

/**
 * 单科目成绩走势：读取该科目每日学习与复习记录，用折线展示正确率变化。
 */
@Component({
  selector: 'app-practice-score-history',
  imports: [NgxEchartsDirective],
  templateUrl: './practice-score-history.component.html',
  styleUrl: './practice-score-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeScoreHistoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly storage = inject(PracticeStorageService);
  readonly track = readHistoryTrack(this.route);
  readonly pageTitle = `${PRACTICE_HISTORY_TRACK_LABELS[this.track]} 成绩走势`;
  readonly records = signal(this.storage.readSessionHistoryForTrack(this.track));
  readonly chartOption = computed(() => {
    const records = this.records();
    if (!records.length) return {};
    const dark =
      typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
    return buildScoreTrendOption(records, dark);
  });
}
