import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RecordsModule } from './records/records.module';
import { GameScoresModule } from './game-scores/game-scores.module';
import { ExportModule } from './export/export.module';
import { NotesModule } from './notes/notes.module';
import { WeatherModule } from './weather/weather.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 全局限流：每个 IP 每分钟最多 60 次请求
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RecordsModule,
    GameScoresModule,
    ExportModule,
    NotesModule,
    WeatherModule,
  ],
  controllers: [AppController],
  providers: [
    // 全局启用限流守卫
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
