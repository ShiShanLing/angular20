import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // 安全 HTTP 头
  app.use(helmet());

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
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs:  http://localhost:${port}/api/docs`);
}
bootstrap();
