import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Repository } from 'typeorm';
import { Record as UserRecord } from '../records/entities/record.entity';
import { PracticeBank } from './practice-bank.entity';
import { PracticeQuestion } from './practice-question.entity';
import { PracticeStar } from './practice-star.entity';

const TRACKS = new Set(['ios', 'frontend', 'angular', 'ts', 'agent', 'practice']);
const LEGACY_STAR_TYPE = 'practice-starred';

@Injectable()
export class PracticeBanksService implements OnModuleInit {
  private readonly logger = new Logger(PracticeBanksService.name);

  constructor(
    @InjectRepository(PracticeQuestion)
    private readonly questions: Repository<PracticeQuestion>,
    @InjectRepository(PracticeStar)
    private readonly stars: Repository<PracticeStar>,
    @InjectRepository(PracticeBank)
    private readonly legacyBanks: Repository<PracticeBank>,
    @InjectRepository(UserRecord)
    private readonly records: Repository<UserRecord>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.importBundledQuestions();
    } catch (error) {
      this.logger.error('题库入库失败', error instanceof Error ? error.stack : String(error));
    }
  }

  async listQuestions(track: string): Promise<{ questions: Record<string, unknown>[] }> {
    this.assertTrack(track);
    const rows = await this.questions.find({ where: { track } });
    return {
      questions: rows.map((row) => ({ ...row.data, id: row.questionId })),
    };
  }

  async updateQuestion(
    track: string,
    questionId: string,
    patch: { answer: string; question?: string },
  ): Promise<Record<string, unknown>> {
    this.assertTrack(track);
    const id = this.assertQuestionId(questionId);
    const answer = patch.answer.trim();
    if (!answer || answer.length > 20000) throw new BadRequestException('答案不能为空');
    const question = (patch.question ?? '').trim();
    if (question.length > 2000) throw new BadRequestException('题目太长');

    const existing = await this.questions.findOne({ where: { track, questionId: id } });
    const row = existing ?? this.questions.create({ track, questionId: id, data: { id } });
    row.data = {
      ...row.data,
      id,
      answer,
      ...(question ? { question } : {}),
    };
    const saved = await this.questions.save(row);
    return { ...saved.data, id: saved.questionId };
  }

  async listStars(userId: number, track: string): Promise<{ ids: string[] }> {
    this.assertTrack(track);
    await this.importLegacyStars(userId, track);
    const rows = await this.stars.find({ where: { userId, track } });
    return { ids: rows.map((row) => row.questionId) };
  }

  async addStars(userId: number, track: string, ids: string[]): Promise<{ ids: string[] }> {
    this.assertTrack(track);
    await this.importLegacyStars(userId, track);
    const unique = this.cleanIds(ids);
    if (unique.length) {
      const existing = new Set(
        (await this.stars.find({ where: { userId, track } })).map((row) => row.questionId),
      );
      const missing = unique.filter((questionId) => !existing.has(questionId));
      if (missing.length) {
        await this.stars.save(
          missing.map((questionId) => this.stars.create({ userId, track, questionId })),
        );
      }
    }
    const rows = await this.stars.find({ where: { userId, track } });
    return { ids: rows.map((row) => row.questionId) };
  }

  async addStar(userId: number, track: string, questionId: string): Promise<{ ids: string[] }> {
    return this.addStars(userId, track, [questionId]);
  }

  async removeStar(userId: number, track: string, questionId: string): Promise<{ ids: string[] }> {
    this.assertTrack(track);
    await this.importLegacyStars(userId, track);
    const id = this.assertQuestionId(questionId);
    await this.stars.delete({ userId, track, questionId: id });
    const rows = await this.stars.find({ where: { userId, track } });
    return { ids: rows.map((row) => row.questionId) };
  }

  private async importBundledQuestions(): Promise<void> {
    const file = join(__dirname, 'practice-seeds.json');
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      this.logger.warn(`没有找到题目清单 ${file}，跳过入库`);
      return;
    }
    if (!parsed || typeof parsed !== 'object') return;
    const banks = parsed as Record<string, unknown>;
    for (const track of TRACKS) {
      await this.importLegacyBank(track);
      const rows = Array.isArray(banks[track]) ? banks[track] : [];
      const inserted = await this.insertMissingQuestions(track, rows);
      const total = await this.questions.count({ where: { track } });
      this.logger.log(`${track} 题库 ${total} 题，本次新写入 ${inserted} 题`);
    }
  }

  private async importLegacyBank(track: string): Promise<void> {
    const legacy = await this.legacyBanks.findOne({ where: { track } });
    if (!Array.isArray(legacy?.questions) || !legacy.questions.length) return;
    await this.insertMissingQuestions(track, legacy.questions);
  }

  private async insertMissingQuestions(track: string, rows: unknown[]): Promise<number> {
    const existing = new Set(
      (await this.questions.find({ where: { track }, select: ['questionId'] })).map((row) => row.questionId),
    );
    const fresh = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
      const record = row as Record<string, unknown>;
      const id = typeof record['id'] === 'string' ? record['id'].trim() : '';
      if (!id || id.length > 80 || existing.has(id) || fresh.has(id)) continue;
      fresh.set(id, { ...record, id });
    }
    const values = [...fresh.entries()].map(([questionId, data]) =>
      this.questions.create({ track, questionId, data }),
    );
    if (!values.length) return 0;
    await this.questions.save(values, { chunk: 80 });
    return values.length;
  }

  private async importLegacyStars(userId: number, track: string): Promise<void> {
    const count = await this.stars.count({ where: { userId, track } });
    if (count > 0) return;
    const records = await this.records.find({ where: { userId, type: LEGACY_STAR_TYPE } });
    const legacy = records.find((row) => row?.data?.track === track);
    const ids = this.cleanIds(legacy?.data?.ids);
    if (!legacy || !ids.length) return;
    await this.stars.save(ids.map((questionId) => this.stars.create({ userId, track, questionId })));
    legacy.data = { ...legacy.data, ids: [] };
    await this.records.save(legacy);
  }

  private cleanIds(ids: unknown): string[] {
    if (!Array.isArray(ids)) return [];
    const unique = [
      ...new Set(
        ids
          .filter((id): id is string => typeof id === 'string' && !!id.trim())
          .map((id) => id.trim()),
      ),
    ];
    if (unique.length > 2000 || unique.some((id) => id.length > 80)) {
      throw new BadRequestException('标星题目不对');
    }
    return unique;
  }

  private assertQuestionId(questionId: string): string {
    const id = questionId.trim();
    if (!id || id.length > 80) throw new BadRequestException('题目 id 不对');
    return id;
  }

  private assertTrack(track: string): void {
    if (!TRACKS.has(track)) throw new BadRequestException('不认识的背题科目');
  }
}
