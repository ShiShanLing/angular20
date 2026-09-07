import type { PracticeItem } from './practice.types';
import type { PracticeStorageScope } from './practice-storage.service';
import {
  agentJobSeedToPracticeItems,
  agentObjectiveSeedToPracticeItems,
  angularJobSeedToPracticeItems,
  iosJobObjectiveSeedToPracticeItems,
  iosJobSeedToPracticeItems,
  iosSeedToPracticeItems,
} from './ios-seed';

export function builtinSeedForScope(
  scope: PracticeStorageScope,
  importedAt: number
): PracticeItem[] {
  switch (scope) {
    case 'ios-learning':
      return iosJobSeedToPracticeItems(importedAt);
    case 'ios-objective-learning':
      return iosJobObjectiveSeedToPracticeItems(importedAt);
    case 'angular-learning':
      return angularJobSeedToPracticeItems(importedAt, 'angular');
    case 'ts-learning':
      return angularJobSeedToPracticeItems(importedAt, 'ts');
    case 'agent-learning':
      return agentJobSeedToPracticeItems(importedAt);
    case 'agent-objective-learning':
      return agentObjectiveSeedToPracticeItems(importedAt);
    case 'practice':
      return iosSeedToPracticeItems(importedAt);
    default:
      return [];
  }
}
