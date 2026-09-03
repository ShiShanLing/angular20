import type { PracticeItem } from './practice.types';
import iosSeedJson from './seeds/ios/ios.seed.json';
import iosJobSeedJson from './seeds/ios/ios-job.seed.json';
import iosJobObjectiveSeedJson from './seeds/ios/ios-job-objective.seed.json';
import angularJobSeedJson from './seeds/angular/angular-job.seed.json';
import agentObjectiveSeedJson from './seeds/agent/agent-objective.seed.json';
import agentJobSeedJson from './seeds/agent/agent-job.seed.json';

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
  return objectiveRowsToPracticeItems(iosJobObjectiveSeedJson as ObjectiveSeedRow[], importedAt, 'ios');
}

/** 将 Agent 客观题 JSON 转为本应用 PracticeItem。 */
export function agentObjectiveSeedToPracticeItems(importedAt: number): PracticeItem[] {
  return objectiveRowsToPracticeItems(agentObjectiveSeedJson as ObjectiveSeedRow[], importedAt, 'agent');
}

/** 将 Agent 简答题 JSON 转为本应用 PracticeItem。 */
export function agentJobSeedToPracticeItems(importedAt: number): PracticeItem[] {
  const rows = agentJobSeedJson as IosSeedRow[];
  return rowsToPracticeItems(rows, importedAt, 'agent');
}

function objectiveRowsToPracticeItems(
  rows: ObjectiveSeedRow[],
  importedAt: number,
  category: PracticeItem['category'],
): PracticeItem[] {
  return rows.map((row) => ({
    id: row.id,
    category,
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
export function angularJobSeedToPracticeItems(
  importedAt: number,
  track: 'angular' | 'ts' | 'all' = 'all'
): PracticeItem[] {
  const rows = angularJobSeedJson as IosSeedRow[];
  return rows
    .map((row) => ({ row, category: angularRowCategory(row) }))
    .filter(({ category }) => {
      if (track === 'ts') return category === 'angular-ts';
      if (track === 'angular') return category !== 'angular-ts';
      return true;
    })
    .map(({ row, category }) => rowToPracticeItem(row, importedAt, category));
}

function rowsToPracticeItems(
  rows: IosSeedRow[],
  importedAt: number,
  category: PracticeItem['category']
): PracticeItem[] {
  return rows.map((row) => rowToPracticeItem(row, importedAt, category));
}

function rowToPracticeItem(row: IosSeedRow, importedAt: number, category: PracticeItem['category']): PracticeItem {
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
}

function angularRowCategory(row: IosSeedRow): PracticeItem['category'] {
  const topic = row.topic ?? '';
  if (topic.startsWith('TypeScript')) return 'angular-ts';
  if (topic.startsWith('JavaScript')) return 'angular-js';
  if (topic === 'CSS' || topic.includes('样式')) return 'angular-css';
  return 'angular';
}

function objectiveTypeLabel(type: ObjectiveSeedRow['type']): string {
  if (type === 'trueFalse') return '判断题';
  if (type === 'multiple') return '多选题';
  return '单选题';
}
