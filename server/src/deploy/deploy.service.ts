import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
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
  private runningRunId: string | null = null;

  constructor(private readonly config: ConfigService) {}

  triggerDeploy(): { status: 'started' | 'already_running'; runId: string } {
    const existing = this.findActiveRun();
    if (existing) {
      return { status: 'already_running', runId: existing.runId };
    }

    const runId = randomUUID();
    const status: DeployRunStatus = {
      runId,
      state: 'queued',
      requestedAt: new Date().toISOString(),
      commit: this.config.get<string>('GITHUB_SHA'),
    };
    this.writeDeployStatus(status);

    const requestDir = this.config.get<string>('DEPLOY_REQUEST_DIR');
    if (requestDir) {
      this.enqueueDeployRequest(runId);
      this.logger.log(`Deploy request queued: ${runId}`);
      return { status: 'started', runId };
    }

    this.startLocalDeploy(runId);
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

  private enqueueDeployRequest(runId: string): void {
    const requestDir = this.config.get<string>('DEPLOY_REQUEST_DIR');
    if (!requestDir) return;

    mkdirSync(requestDir, { recursive: true });
    writeFileSync(
      join(requestDir, `${runId}.json`),
      JSON.stringify(
        {
          runId,
          requestedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  }

  private startLocalDeploy(runId: string): void {
    this.runningRunId = runId;

    const projectDir = this.config.get<string>('PROJECT_DIR', '/root/projects/angular20');
    const scriptPath = join(projectDir, 'scripts/deploy-full.sh');
    const logPath = this.config.get<string>('DEPLOY_LOG_PATH', '/var/log/angular20-deploy.log');
    const statusFile = this.statusFileFor(runId);

    mkdirSync('/var/log', { recursive: true });
    this.writeDeployStatus({
      ...this.readDeployStatus(runId),
      state: 'running',
      startedAt: new Date().toISOString(),
    });

    const child = spawn(
      'bash',
      [
        '-lc',
        [
          'set +e',
          `"${scriptPath}" >> "${logPath}" 2>&1`,
          'code=$?',
          'state="failure"',
          'if [ "$code" -eq 0 ]; then state="success"; fi',
          `node -e 'const fs=require("fs"); const file=process.argv[1]; const state=process.argv[2]; const code=Number(process.argv[3]); const data=JSON.parse(fs.readFileSync(file,"utf8")); data.state=state; data.exitCode=code; data.finishedAt=new Date().toISOString(); fs.writeFileSync(file, JSON.stringify(data,null,2));' "${statusFile}" "$state" "$code"`,
          'exit "$code"',
        ].join('; '),
      ],
      {
        cwd: projectDir,
        detached: true,
        stdio: 'ignore',
      },
    );

    child.unref();

    child.on('exit', (code) => {
      this.runningRunId = null;
      this.logger.log(`Deploy ${runId} finished with code ${code ?? 'unknown'}`);
    });

    child.on('error', (err) => {
      this.runningRunId = null;
      this.writeDeployStatus({
        ...this.readDeployStatus(runId),
        state: 'failure',
        finishedAt: new Date().toISOString(),
        message: err.message,
      });
      this.logger.error(`Deploy ${runId} failed to start: ${err.message}`);
    });

    this.logger.log(`Deploy started in background: ${runId}`);
  }

  private findActiveRun(): DeployRunStatus | null {
    if (this.runningRunId) {
      return this.readDeployStatus(this.runningRunId);
    }
    const statusDir = this.statusDir();
    if (!existsSync(statusDir)) {
      return null;
    }
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
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    return statuses[0] ?? null;
  }

  private writeDeployStatus(status: DeployRunStatus): void {
    const statusDir = this.statusDir();
    mkdirSync(statusDir, { recursive: true });
    writeFileSync(this.statusFileFor(status.runId), JSON.stringify(status, null, 2));
  }

  private statusDir(): string {
    return this.config.get<string>('DEPLOY_STATUS_DIR', '/var/lib/angular20-deploy/status');
  }

  private statusFileFor(runId: string): string {
    return join(this.statusDir(), `${runId}.json`);
  }
}
