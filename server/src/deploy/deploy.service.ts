import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';

export type DeployRunState = 'queued' | 'running' | 'success' | 'failure';

export interface DeployRunStatus {
  runId: string;
  state: DeployRunState;
  requestedAt: string;
  startedAt?: string;
  finishedAt?: string;
  exitCode?: number | null;
  commit?: string;
  message?: string;
}

@Injectable()
export class DeployService {
  private readonly logger = new Logger(DeployService.name);

  constructor(private readonly config: ConfigService) {}

  triggerDeploy(commit?: string): { status: 'started' | 'already_running'; runId: string } {
    const normalizedCommit = commit?.trim().toLowerCase();
    if (!normalizedCommit || !/^[0-9a-f]{40}$/.test(normalizedCommit)) {
      throw new BadRequestException('A full 40-character Git commit SHA is required');
    }

    const requestDir = this.config.get<string>('DEPLOY_REQUEST_DIR');
    if (!requestDir) {
      throw new ServiceUnavailableException('Server deployment worker is not configured');
    }

    const existing = this.findActiveRun();
    if (existing) {
      return { status: 'already_running', runId: existing.runId };
    }

    const runId = randomUUID();
    const status: DeployRunStatus = {
      runId,
      state: 'queued',
      requestedAt: new Date().toISOString(),
      commit: normalizedCommit,
    };
    this.writeDeployStatus(status);
    this.enqueueDeployRequest(runId, normalizedCommit);
    this.logger.log(`Deploy request queued: ${runId} (${normalizedCommit})`);
    return { status: 'started', runId };
  }

  readDeployStatus(runId: string): DeployRunStatus {
    if (!/^[0-9a-f-]{36}$/i.test(runId)) {
      throw new NotFoundException('Deploy run not found');
    }

    const statusFile = this.statusFileFor(runId);
    if (!existsSync(statusFile)) {
      throw new NotFoundException('Deploy run not found');
    }

    return JSON.parse(readFileSync(statusFile, 'utf8')) as DeployRunStatus;
  }

  private enqueueDeployRequest(runId: string, commit: string): void {
    const requestDir = this.config.get<string>('DEPLOY_REQUEST_DIR');
    if (!requestDir) return;

    mkdirSync(requestDir, { recursive: true });
    const requestFile = join(requestDir, `${runId}.json`);
    const temporaryFile = `${requestFile}.tmp-${process.pid}`;
    writeFileSync(
      temporaryFile,
      JSON.stringify(
        {
          runId,
          commit,
          requestedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    renameSync(temporaryFile, requestFile);
  }

  private findActiveRun(): DeployRunStatus | null {
    const statusDir = this.statusDir();
    if (!existsSync(statusDir)) {
      return null;
    }
    const activeTtlMs = this.config.get<number>('DEPLOY_ACTIVE_TTL_MS', 30 * 60 * 1000);
    const cutoff = Date.now() - activeTtlMs;
    const statuses = readdirSync(statusDir)
      .filter((name) => name.endsWith('.json'))
      .map((name) => {
        try {
          return JSON.parse(readFileSync(join(statusDir, name), 'utf8')) as DeployRunStatus;
        } catch {
          return null;
        }
      })
      .filter((status): status is DeployRunStatus => !!status)
      .filter((status) => status.state === 'queued' || status.state === 'running')
      .filter((status) => Date.parse(status.requestedAt) >= cutoff)
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    return statuses[0] ?? null;
  }

  private writeDeployStatus(status: DeployRunStatus): void {
    const statusDir = this.statusDir();
    mkdirSync(statusDir, { recursive: true });
    const statusFile = this.statusFileFor(status.runId);
    const temporaryFile = `${statusFile}.tmp-${process.pid}`;
    writeFileSync(temporaryFile, JSON.stringify(status, null, 2));
    renameSync(temporaryFile, statusFile);
  }

  private statusDir(): string {
    return this.config.get<string>('DEPLOY_STATUS_DIR', '/var/lib/angular20-deploy/status');
  }

  private statusFileFor(runId: string): string {
    return join(this.statusDir(), `${runId}.json`);
  }
}
