import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // 安全 HTTP 头（HTTP环境关闭 COOP/COEP/CSP升级/HSTS，避免浏览器强制 HTTPS）
  app.use(helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: null,
      },
    },
    hsts: false,
  }));

  // 全局前缀
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:4200'),
    credentials: true,
  });

  // 全局校验管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API 文档
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Angular20 API')
    .setDescription('个人工具平台后端接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', '认证模块（登录/注册/用户信息）')
    .addTag('records', '使用记录（体重/睡眠/记账）')
    .addTag('game-scores', '游戏分数（贪吃蛇/俄罗斯方块）')
    .addTag('export', '数据导出（CSV/Excel）')
    .addTag('notes', '记事本（笔记/文件夹/标签）')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customCssUrl: '/swagger-ui-static/swagger-ui.css',
    customJs: [
      '/swagger-ui-static/swagger-ui-bundle.js',
      '/swagger-ui-static/swagger-ui-standalone-preset.js',
    ],
  });

  // 静态文件服务 - 上传文件
  app.useStaticAssets(join('/var/www/uploads'), { prefix: '/uploads' });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs:  http://localhost:${port}/api/docs`);
}
bootstrap();
