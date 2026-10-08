import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Record as UserRecord } from '../records/entities/record.entity';
import { PracticeBank } from './practice-bank.entity';
import { PracticeBanksController } from './practice-banks.controller';
import { PracticeBanksService } from './practice-banks.service';
import { PracticeQuestion } from './practice-question.entity';
import { PracticeStar } from './practice-star.entity';
import { PracticeStarsController } from './practice-stars.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PracticeQuestion, PracticeStar, PracticeBank, UserRecord]), AuthModule],
  controllers: [PracticeBanksController, PracticeStarsController],
  providers: [PracticeBanksService],
})
export class PracticeBanksModule {}
