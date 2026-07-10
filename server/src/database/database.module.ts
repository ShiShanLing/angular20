import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Record } from '../records/entities/record.entity';
import { GameScore } from '../game-scores/entities/game-score.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_PATH', '/var/lib/mydata/app.db'),
        entities: [User, Record, GameScore],
        synchronize: true, // 开发环境自动同步表结构
      }),
    }),
  ],
})
export class DatabaseModule {}
