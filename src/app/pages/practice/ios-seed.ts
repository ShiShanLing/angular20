import type { PracticeItem } from './practice.types';
import iosSeedJson from './ios.seed.json';
import iosJobSeedJson from './ios-job.seed.json';

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

/** 将扩展内导出的 iOS 题库 JSON 转为本应用 PracticeItem（默认可用 Markdown 展示答案）。 */
export function iosSeedToPracticeItems(importedAt: number): PracticeItem[] {
  const rows = iosSeedJson as IosSeedRow[];
  return rowsToPracticeItems(rows, importedAt);
}

/** 将 iOS 面试刷题计划 JSON 转为本应用 PracticeItem。 */
export function iosJobSeedToPracticeItems(importedAt: number): PracticeItem[] {
  const rows = iosJobSeedJson as IosSeedRow[];
  return rowsToPracticeItems(rows, importedAt);
}

function rowsToPracticeItems(rows: IosSeedRow[], importedAt: number): PracticeItem[] {
  return rows.map((row) => {
    const tags = [row.topic, row.difficulty].filter(Boolean).join(' · ');
    const item: PracticeItem = {
      id: row.id,
      category: 'ios',
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
