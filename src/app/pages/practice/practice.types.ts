export type PracticeCategory =
  | 'ios'
  | 'angular'
  | 'android'
  | 'angular-ts'
  | 'angular-js'
  | 'angular-css';

export const PRACTICE_CATEGORY_LABELS: Record<PracticeCategory, string> = {
  ios: 'iOS',
  angular: 'Angular',
  android: 'Android',
  'angular-ts': 'Angular · TypeScript',
  'angular-js': 'Angular · JavaScript',
  'angular-css': 'Angular · CSS',
};

export const PRACTICE_CATEGORY_LIST: PracticeCategory[] = [
  'ios',
  'angular',
  'android',
  'angular-ts',
  'angular-js',
  'angular-css',
];
//NSTimer 被 RunLoop 持有，Timer 又会强持有 target；如果 target 再强持有 Timer，就形成循环引用。解决方式是 invalidate、block 中 weak self、弱代理，或改用 DispatchSourceTimer 并注意弱捕获。





/** 刷题页分类筛选：`全部` + 单一分类 */
export type PracticeFilterCategory = PracticeCategory | 'all';
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
  /** 为 true 时答案按 Markdown 渲染（代码块、加粗、表格等） */
  markD?: boolean;
  /** 面试口播一句（可选，内置 iOS 题库有） */
  oralOneLiner?: string;
}

export interface PracticeItemDraft {
  category: PracticeCategory;
  question: string;
  answer: string;
  tags: string;
  /** Excel 行号（从 2 开始，含表头时为数据行号） */
  sourceRow: number;
  /** 为 true 时导入后答案按 Markdown 渲染 */
  markD?: boolean;
  oralOneLiner?: string;
}
