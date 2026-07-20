import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class DeployService {
  private readonly logger = new Logger(DeployService.name);
  private running = false;

  constructor(private readonly config: ConfigService) {}

  triggerDeploy(): { status: 'started' | 'already_running' } {
    if (this.running) {
      return { status: 'already_running' };
    }

    const projectDir = this.config.get<string>('PROJECT_DIR', '/root/projects/angular20');
    const scriptPath = join(projectDir, 'scripts/deploy-full.sh');
    const logPath = this.config.get<string>('DEPLOY_LOG_PATH', '/var/log/angular20-deploy.log');

    mkdirSync('/var/log', { recursive: true });
    appendFileSync(logPath, `\n[${new Date().toISOString()}] deploy triggered\n`);

    this.running = true;
    const child = spawn(
      'bash',
      ['-c', `"${scriptPath}" >> "${logPath}" 2>&1`],
      {
        cwd: projectDir,
        detached: true,
        stdio: 'ignore',
      },
    );

    child.unref();

    child.on('exit', (code) => {
      this.running = false;
      appendFileSync(
        logPath,
        `[${new Date().toISOString()}] deploy finished with code ${code ?? 'unknown'}\n`,
      );
      this.logger.log(`Deploy finished with code ${code ?? 'unknown'}`);
    });

    child.on('error', (err) => {
      this.running = false;
      appendFileSync(logPath, `[${new Date().toISOString()}] deploy error: ${err.message}\n`);
      this.logger.error(`Deploy failed to start: ${err.message}`);
    });

    this.logger.log('Deploy started in background');
    return { status: 'started' };
  }
}
