import { sortKeyBeforeDisplay } from './practice-sort';

describe('sortKeyBeforeDisplay', () => {
  const items = Array.from({ length: 51 }, (_, index) => ({ no: index + 1 }));

  it('places a question between 49 and 50 when inserting before the 50th', () => {
    expect(sortKeyBeforeDisplay(items, 50)).toBe(49.5);
  });

  it('appends after the last question', () => {
    expect(sortKeyBeforeDisplay(items, 52)).toBe(52);
  });
});
