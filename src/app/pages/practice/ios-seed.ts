import type { PracticeItem } from './practice.types';
import iosSeedJson from './ios.seed.json';
import iosJobSeedJson from './ios-job.seed.json';
import iosJobObjectiveSeedJson from './ios-job-objective.seed.json';
import angularJobSeedJson from './angular-job.seed.json';

export interface IosSeedRow {
  id: string;
  category: string;
  topic: string;
  question: string;
  answer: string;
  difficulty: string;
  oralOneLiner: string;
  markD?: boolean;
}

export interface ObjectiveSeedRow {
  id: string;
  sourceQuestionId: string;
  category: string;
  topic: string;
  type: 'trueFalse' | 'single' | 'multiple';
  question: string;
  options: { id: string; text: string }[];
  correctAnswers: string[];
  explanation: string;
  difficulty: string;
}

/** 将扩展内导出的 iOS 题库 JSON 转为本应用 PracticeItem（默认可用 Markdown 展示答案）。 */
export function iosSeedToPracticeItems(importedAt: number): PracticeItem[] {
  const rows = iosSeedJson as IosSeedRow[];
  return rowsToPracticeItems(rows, importedAt, 'ios');
}

/** 将 iOS 知识刷题计划 JSON 转为本应用 PracticeItem。 */
export function iosJobSeedToPracticeItems(importedAt: number): PracticeItem[] {
  const rows = iosJobSeedJson as IosSeedRow[];
  return rowsToPracticeItems(rows, importedAt, 'ios');
}

/** 将 iOS 客观题 JSON 转为本应用 PracticeItem。 */
export function iosJobObjectiveSeedToPracticeItems(importedAt: number): PracticeItem[] {
  const rows = iosJobObjectiveSeedJson as ObjectiveSeedRow[];
  return rows.map((row) => ({
    id: row.id,
    category: 'ios',
    question: row.question,
    answer: row.explanation,
    tags: [row.topic, row.difficulty, objectiveTypeLabel(row.type)].filter(Boolean).join(' · '),
    importedAt,
    markD: false,
    questionType: row.type,
    options: row.options,
    correctAnswers: row.correctAnswers,
    explanation: row.explanation,
    sourceQuestionId: row.sourceQuestionId,
  }));
}

/** 将 Angular 知识刷题计划 JSON 转为本应用 PracticeItem。 */
export function angularJobSeedToPracticeItems(importedAt: number): PracticeItem[] {
  const rows = angularJobSeedJson as IosSeedRow[];
  return rowsToPracticeItems(rows, importedAt, 'angular');
}

function rowsToPracticeItems(
  rows: IosSeedRow[],
  importedAt: number,
  category: PracticeItem['category']
): PracticeItem[] {
  return rows.map((row) => {
    const tags = [row.topic, row.difficulty].filter(Boolean).join(' · ');
    const item: PracticeItem = {
      id: row.id,
      category,
      question: row.question,
      answer: row.answer,
      tags,
      importedAt,
    };
    if (row.markD !== false) {
      item.markD = true;
    }
    if (row.oralOneLiner?.trim()) {
      item.oralOneLiner = row.oralOneLiner.trim();
    }
    return item;
  });
}

function objectiveTypeLabel(type: ObjectiveSeedRow['type']): string {
  if (type === 'trueFalse') return '判断题';
  if (type === 'multiple') return '多选题';
  return '单选题';
}
