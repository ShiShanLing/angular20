export type PracticeCategory =
  | 'ios'
  | 'android'
  | 'angular-ts'
  | 'angular-js'
  | 'angular-css';

export const PRACTICE_CATEGORY_LABELS: Record<PracticeCategory, string> = {
  ios: 'iOS',
  android: 'Android',
  'angular-ts': 'Angular · TypeScript',
  'angular-js': 'Angular · JavaScript',
  'angular-css': 'Angular · CSS',
};

export const PRACTICE_CATEGORY_LIST: PracticeCategory[] = [
  'ios',
  'android',
  'angular-ts',
  'angular-js',
  'angular-css',
];

export interface PracticeItem {
  id: string;
  category: PracticeCategory;
  /** 面试问题 / 题干 */
  question: string;
  /** 参考答案（可空，便于你先只录题） */
  answer: string;
  /** 可选：标签或备注 */
  tags: string;
  importedAt: number;
}

export interface PracticeItemDraft {
  category: PracticeCategory;
  question: string;
  answer: string;
  tags: string;
  /** Excel 行号（从 2 开始，含表头时为数据行号） */
  sourceRow: number;
}
