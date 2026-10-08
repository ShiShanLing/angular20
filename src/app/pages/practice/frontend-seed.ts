import type { PracticeItem } from './practice.types';
import frontendJobSeedJson from './seeds/frontend/frontend-job.seed.json';

export interface FrontendSeedRow {
  no: number;
  id: string;
  category: string;
  topic: string;
  question: string;
  answer: string;
  difficulty: string;
}

/** 将合并后的前端题库（Angular / TypeScript / JavaScript / RxJS）转为背题条目。 */
export function frontendRowsToPracticeItems(rows: FrontendSeedRow[], importedAt: number): PracticeItem[] {
  return rows.map((row) => ({
    id: row.id,
    no: row.no,
    category: 'angular',
    question: row.question,
    answer: row.answer,
    tags: [row.category, row.topic, row.difficulty].filter(Boolean).join(' · '),
    importedAt,
    markD: true,
  }));
}

export function frontendJobSeedToPracticeItems(importedAt: number): PracticeItem[] {
  return frontendRowsToPracticeItems(frontendJobSeedJson as FrontendSeedRow[], importedAt);
}
