import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PracticeBank } from './practice-bank.entity';
import { PracticeBanksController } from './practice-banks.controller';
import { PracticeBanksService } from './practice-banks.service';

@Module({
  imports: [TypeOrmModule.forFeature([PracticeBank]), AuthModule],
  controllers: [PracticeBanksController],
  providers: [PracticeBanksService],
})
export class PracticeBanksModule {}
