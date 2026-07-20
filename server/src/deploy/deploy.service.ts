import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { createWriteStream, mkdirSync } from 'fs';
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
    const logStream = createWriteStream(logPath, { flags: 'a' });
    logStream.write(`\n[${new Date().toISOString()}] deploy triggered\n`);

    this.running = true;
    const child = spawn('bash', [scriptPath], {
      cwd: projectDir,
      detached: true,
      stdio: ['ignore', logStream, logStream],
    });

    child.unref();

    child.on('exit', (code) => {
      this.running = false;
      logStream.write(
        `[${new Date().toISOString()}] deploy finished with code ${code ?? 'unknown'}\n`,
      );
      logStream.end();
      this.logger.log(`Deploy finished with code ${code ?? 'unknown'}`);
    });

    child.on('error', (err) => {
      this.running = false;
      logStream.write(`[${new Date().toISOString()}] deploy error: ${err.message}\n`);
      logStream.end();
      this.logger.error(`Deploy failed to start: ${err.message}`);
    });

    this.logger.log('Deploy started in background');
    return { status: 'started' };
  }
}
