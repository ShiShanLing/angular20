import type { EChartsOption } from 'echarts';
import type { PracticeSessionRecord } from './practice-storage.service';

const SLIDE_AFTER = 8;
const VISIBLE_POINTS = 16;

export function formatSessionAt(at: number): string {
  const d = new Date(at);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}-${day} ${hh}:${mm}`;
}

export function sessionKindLabel(kind: PracticeSessionRecord['kind']): string {
  return kind === 'review' ? '复习' : '每日学习';
}

function pointsForKind(
  records: PracticeSessionRecord[],
  kind: PracticeSessionRecord['kind']
): Array<[number, number]> {
  return records
    .filter((record) => record.kind === kind)
    .sort((a: PracticeSessionRecord, b: PracticeSessionRecord) => a.at - b.at)
    .map((record) => [record.at, record.percent]);
}

function categoryPointsForKind(
  records: PracticeSessionRecord[],
  labels: string[],
  kind: PracticeSessionRecord['kind']
): Array<number | null> {
  return records.map((record, index) => {
    if (record.kind !== kind) return null;
    return labels[index] != null ? record.percent : null;
  });
}

export function buildScoreTrendOption(
  records: PracticeSessionRecord[],
  dark = false
): EChartsOption {
  const axis = dark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.55)';
  const split = dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const chronological = [...records].sort(
    (a: PracticeSessionRecord, b: PracticeSessionRecord) => a.at - b.at
  );
  const labels = chronological.map((record) => formatSessionAt(record.at));
  const useCategory = chronological.length < 4;
  const canSlide = chronological.length >= SLIDE_AFTER;
  const visible = Math.min(VISIBLE_POINTS, chronological.length);
  const startPercent = canSlide ? Math.max(0, 100 - (visible / chronological.length) * 100) : 0;

  return {
    color: ['#1677ff', '#52c41a'],
    tooltip: {
      trigger: 'axis',
      formatter: (raw: unknown) => {
        const items = Array.isArray(raw) ? raw : [raw];
        const first = items[0] as { dataIndex?: number; data?: [number, number] };
        const record = useCategory
          ? chronological[first.dataIndex ?? -1]
          : chronological.find((item) => item.at === first.data?.[0]);
        if (!record) return '';
        const score = Number.isInteger(record.score) ? String(record.score) : record.score.toFixed(1);
        return `${formatSessionAt(record.at)}<br/>${sessionKindLabel(record.kind)} ${score} / ${record.total}（${record.percent}%）`;
      },
    },
    legend: {
      data: ['每日学习', '复习'],
      textStyle: { color: axis },
    },
    grid: { left: 16, right: 16, top: 40, bottom: canSlide ? 56 : 8, containLabel: true },
    dataZoom: canSlide
      ? [
          {
            type: 'inside',
            xAxisIndex: 0,
            filterMode: 'none',
            zoomOnMouseWheel: false,
            moveOnMouseMove: true,
            moveOnMouseWheel: true,
            start: startPercent,
            end: 100,
          },
          {
            type: 'slider',
            xAxisIndex: 0,
            filterMode: 'none',
            height: 22,
            bottom: 8,
            start: startPercent,
            end: 100,
            brushSelect: false,
            borderColor: split,
            fillerColor: dark ? 'rgba(22, 119, 255, 0.18)' : 'rgba(22, 119, 255, 0.12)',
            handleStyle: { color: '#1677ff' },
            textStyle: { color: axis },
            dataBackground: {
              lineStyle: { color: axis },
              areaStyle: { color: split },
            },
          },
        ]
      : [],
    xAxis: useCategory
      ? {
          type: 'category',
          boundaryGap: true,
          data: labels,
          axisLabel: { color: axis, hideOverlap: true },
          axisLine: { lineStyle: { color: split } },
        }
      : {
          type: 'time',
          axisLabel: { color: axis, hideOverlap: true },
          axisLine: { lineStyle: { color: split } },
        },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '正确率 %',
      nameTextStyle: { color: axis },
      axisLabel: { color: axis, formatter: '{value}%' },
      splitLine: { lineStyle: { color: split } },
    },
    series: [
      {
        name: '每日学习',
        type: 'line',
        showSymbol: true,
        connectNulls: true,
        data: useCategory
          ? categoryPointsForKind(chronological, labels, 'daily')
          : pointsForKind(chronological, 'daily'),
      },
      {
        name: '复习',
        type: 'line',
        showSymbol: true,
        connectNulls: true,
        data: useCategory
          ? categoryPointsForKind(chronological, labels, 'review')
          : pointsForKind(chronological, 'review'),
      },
    ],
  };
}
