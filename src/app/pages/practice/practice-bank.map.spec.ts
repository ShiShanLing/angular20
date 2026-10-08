import { mergeBankRows } from './practice-bank.map';

describe('mergeBankRows', () => {
  it('keeps server edits and still shows questions added later in the repo', () => {
    const bundled = [
      { id: 'a', question: '原题', answer: '原答案' },
      { id: 'b', question: '新题', answer: '新答案' },
    ];
    const server = [{ id: 'a', question: '改过的题', answer: '改过的答案' }];

    expect(mergeBankRows(bundled, server)).toEqual([
      { id: 'a', question: '改过的题', answer: '改过的答案' },
      { id: 'b', question: '新题', answer: '新答案' },
    ]);
  });
});
