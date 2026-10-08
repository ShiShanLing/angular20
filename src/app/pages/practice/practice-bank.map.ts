import type { PracticeItem } from './practice.types';
import type { PracticeHistoryTrack } from './practice-storage.service';
import { frontendRowsToPracticeItems, type FrontendSeedRow } from './frontend-seed';
import frontendJobSeedJson from './seeds/frontend/frontend-job.seed.json';
import iosSeedJson from './seeds/ios/ios.seed.json';
import iosJobSeedJson from './seeds/ios/ios-job.seed.json';
import agentJobSeedJson from './seeds/agent/agent-job.seed.json';
import {
  angularRowsToPracticeItems,
  bundledAngularRows,
  jobRowsToPracticeItems,
  type IosSeedRow,
} from './ios-seed';

export type PracticeBankRow = Record<string, unknown>;

/** 仓库里的题库，只在服务器还没有这一科时作为第一份底稿。 */
export function bundledBankRows(track: PracticeHistoryTrack): PracticeBankRow[] {
  switch (track) {
    case 'ios':
      return iosJobSeedJson as PracticeBankRow[];
    case 'frontend':
      return frontendJobSeedJson as PracticeBankRow[];
    case 'agent':
      return agentJobSeedJson as PracticeBankRow[];
    case 'practice':
      return iosSeedJson as PracticeBankRow[];
    case 'angular':
    case 'ts':
      return bundledAngularRows(track) as unknown as PracticeBankRow[];
    default:
      return [];
  }
}

export function practiceItemsFromBank(
  track: PracticeHistoryTrack,
  rows: PracticeBankRow[],
  importedAt: number,
): PracticeItem[] {
  switch (track) {
    case 'ios':
    case 'practice':
      return jobRowsToPracticeItems(rows as unknown as IosSeedRow[], importedAt, 'ios');
    case 'agent':
      return jobRowsToPracticeItems(rows as unknown as IosSeedRow[], importedAt, 'agent');
    case 'frontend':
      return frontendRowsToPracticeItems(rows as unknown as FrontendSeedRow[], importedAt);
    case 'angular':
    case 'ts':
      return angularRowsToPracticeItems(rows as unknown as IosSeedRow[], importedAt);
    default:
      return [];
  }
}

/** 同一道题以服务器为准；仓库里新加、服务器还没有的题仍然保留。 */
export function mergeBankRows(bundled: PracticeBankRow[], server: PracticeBankRow[]): PracticeBankRow[] {
  const serverById = new Map(
    server
      .filter((row) => typeof row?.['id'] === 'string' && String(row['id']))
      .map((row) => [String(row['id']), row]),
  );
  const merged = bundled.map((row) => serverById.get(String(row['id'])) ?? row);
  const seen = new Set(bundled.map((row) => String(row['id'] ?? '')));
  for (const row of server) {
    const id = String(row?.['id'] ?? '');
    if (id && !seen.has(id)) merged.push(row);
  }
  return merged;
}
