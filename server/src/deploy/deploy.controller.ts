import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeployService } from './deploy.service';

@ApiTags('deploy')
@Controller('deploy')
export class DeployController {
  constructor(
    private readonly deployService: DeployService,
    private readonly config: ConfigService,
  ) {}

  @Post('hook')
  @SkipThrottle()
  @ApiOperation({ summary: 'GitHub Actions 触发生产部署（需 X-Deploy-Token）' })
  trigger(@Headers('x-deploy-token') token?: string) {
    const secret = this.config.get<string>('DEPLOY_HOOK_SECRET');
    if (!secret || token !== secret) {
      throw new UnauthorizedException('Invalid deploy token');
    }
    return this.deployService.triggerDeploy();
  }
}
