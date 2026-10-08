import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticeBank } from './practice-bank.entity';

const TRACKS = new Set(['ios', 'frontend', 'angular', 'ts', 'agent', 'practice']);

@Injectable()
export class PracticeBanksService {
  constructor(
    @InjectRepository(PracticeBank)
    private readonly banks: Repository<PracticeBank>,
  ) {}

  async get(track: string): Promise<PracticeBank> {
    this.assertTrack(track);
    const bank = await this.banks.findOne({ where: { track } });
    if (!bank) throw new NotFoundException('这一科还没有线上题库');
    return bank;
  }

  async replace(track: string, questions: unknown[]): Promise<PracticeBank> {
    this.assertTrack(track);
    const rows = this.assertQuestions(questions);
    const existing = await this.banks.findOne({ where: { track } });
    if (!existing) {
      return this.banks.save(this.banks.create({ track, questions: rows }));
    }
    existing.questions = rows;
    return this.banks.save(existing);
  }

  async updateQuestion(
    track: string,
    questionId: string,
    patch: { answer: string; question?: string },
  ): Promise<Record<string, unknown>> {
    this.assertTrack(track);
    const bank = await this.banks.findOne({ where: { track } });
    if (!bank) throw new NotFoundException('这一科还没有线上题库');
    const index = bank.questions.findIndex((row) => row?.['id'] === questionId);
    if (index < 0) throw new NotFoundException('题目不存在');
    const next = bank.questions.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      return {
        ...row,
        answer: patch.answer,
        ...(patch.question?.trim() ? { question: patch.question.trim() } : {}),
      };
    });
    bank.questions = next;
    await this.banks.save(bank);
    return next[index];
  }

  private assertTrack(track: string): void {
    if (!TRACKS.has(track)) throw new BadRequestException('不认识的背题科目');
  }

  private assertQuestions(questions: unknown[]): Record<string, unknown>[] {
    if (!Array.isArray(questions) || questions.length === 0 || questions.length > 5000) {
      throw new BadRequestException('题库格式不对');
    }
    return questions.map((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw new BadRequestException('题目格式不对');
      }
      const record = row as Record<string, unknown>;
      if (typeof record['id'] !== 'string' || !record['id'].trim()) {
        throw new BadRequestException('题目缺少 id');
      }
      return record;
    });
  }
}
