import { buildScoreTrendOption, formatSessionAt, sessionKindLabel } from './practice-score-trend.util';
import type { PracticeSessionRecord } from './practice-storage.service';

function record(overrides: Partial<PracticeSessionRecord>): PracticeSessionRecord {
  return {
    id: 'id',
    kind: 'daily',
    at: 1,
    score: 5,
    total: 5,
    percent: 100,
    questionMode: 'subjective',
    wrongCount: 0,
    ...overrides,
  };
}

describe('practice-score-trend.util', () => {
  it('labels session kinds', () => {
    expect(sessionKindLabel('daily')).toBe('每日学习');
    expect(sessionKindLabel('review')).toBe('复习');
  });

  it('formats session time as month-day hour:minute', () => {
    expect(formatSessionAt(Date.UTC(2026, 8, 3, 2, 5))).toMatch(/\d{2}-\d{2} \d{2}:\d{2}/);
  });

  it('builds separate daily and review series for the trend chart', () => {
    const option = buildScoreTrendOption([
      record({ id: 'd', kind: 'daily', at: 10, percent: 100 }),
      record({ id: 'r', kind: 'review', at: 20, percent: 60, score: 3, total: 5, wrongCount: 2 }),
    ]);
    const series = option.series as Array<{ name: string; data: Array<number | null> | Array<[number, number]> }>;
    expect(series[0].name).toBe('每日学习');
    expect(series[0].data).toEqual([100, null]);
    expect(series[1].name).toBe('复习');
    expect(series[1].data).toEqual([null, 60]);
    expect(option.dataZoom).toEqual([]);
  });

  it('enables horizontal pan when there are many records', () => {
    const option = buildScoreTrendOption(
      Array.from({ length: 20 }, (_, i) =>
        record({ id: `r-${i}`, at: i + 1, percent: 50 + (i % 10), kind: i % 2 ? 'review' : 'daily' })
      )
    );
    const zooms = option.dataZoom as Array<{ type: string; start: number; end: number }>;
    expect(zooms.map((zoom) => zoom.type)).toEqual(['inside', 'slider']);
    expect(zooms[0].end).toBe(100);
    expect(zooms[0].start).toBeGreaterThan(0);
  });
});
