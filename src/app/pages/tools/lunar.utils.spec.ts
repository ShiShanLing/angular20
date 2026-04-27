import { LunarUtils } from './lunar.utils';

describe('LunarUtils', () => {
  it('converts Spring Festival 2024 (Feb 10) to 正月初一', () => {
    const result = LunarUtils.getLunar(new Date(2024, 1, 10));
    expect(result.year).toBe(2024);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.monthStr).toBe('正月');
    expect(result.dayStr).toBe('初一');
    expect(result.isLeap).toBeFalse();
  });

  it('converts Mid-Autumn Festival 2024 (Sep 17) to 八月十五', () => {
    const result = LunarUtils.getLunar(new Date(2024, 8, 17));
    expect(result.month).toBe(8);
    expect(result.day).toBe(15);
    expect(result.monthStr).toBe('八月');
    expect(result.dayStr).toBe('十五');
  });

  it('converts Spring Festival 2023 (Jan 22) to 正月初一', () => {
    const result = LunarUtils.getLunar(new Date(2023, 0, 22));
    expect(result.year).toBe(2023);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.dayStr).toBe('初一');
  });

  it('formats day strings correctly', () => {
    // day 10 → 初十
    const d10 = LunarUtils.getLunar(new Date(2024, 1, 19));
    expect(d10.dayStr).toBe('初十');

    // day 20 → 二十
    const d20 = LunarUtils.getLunar(new Date(2024, 1, 29));
    expect(d20.dayStr).toBe('二十');
  });

  it('returns a valid result for an arbitrary date', () => {
    const result = LunarUtils.getLunar(new Date(2000, 0, 1));
    expect(result.year).toBeGreaterThan(1899);
    expect(result.month).toBeGreaterThanOrEqual(1);
    expect(result.month).toBeLessThanOrEqual(12);
    expect(result.day).toBeGreaterThanOrEqual(1);
    expect(result.day).toBeLessThanOrEqual(30);
    expect(typeof result.monthStr).toBe('string');
    expect(typeof result.dayStr).toBe('string');
  });
});
