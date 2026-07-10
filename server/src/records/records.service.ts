import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Record } from './entities/record.entity';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(Record)
    private readonly recordRepo: Repository<Record>,
  ) {}

  async findAll(userId: number, type?: string, startDate?: string, endDate?: string) {
    const qb = this.recordRepo.createQueryBuilder('r')
      .where('r.userId = :userId', { userId });

    if (type) {
      qb.andWhere('r.type = :type', { type });
    }
    if (startDate) {
      qb.andWhere('r.recordDate >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('r.recordDate <= :endDate', { endDate });
    }

    qb.orderBy('r.recordDate', 'DESC');
    return qb.getMany();
  }

  async create(userId: number, type: string, data: any, recordDate?: string) {
    const record = this.recordRepo.create({
      userId,
      type,
      data,
      recordDate: recordDate || new Date().toISOString().split('T')[0],
    });
    return this.recordRepo.save(record);
  }

  async update(id: number, userId: number, data: any, recordDate?: string) {
    const record = await this.recordRepo.findOne({ where: { id, userId } });
    if (!record) return null;
    record.data = data;
    if (recordDate) record.recordDate = recordDate;
    return this.recordRepo.save(record);
  }

  async remove(id: number, userId: number) {
    const result = await this.recordRepo.delete({ id, userId });
    return result.affected ? true : false;
  }

  async bulkSync(userId: number, type: string, records: any[]) {
    // 删除该用户该类型的所有旧记录
    await this.recordRepo.delete({ userId, type });
    // 批量插入新记录
    const entities = records.map(r =>
      this.recordRepo.create({
        userId,
        type,
        data: r.data || r,
        recordDate: r.recordDate || r.date || new Date().toISOString().split('T')[0],
      }),
    );
    return this.recordRepo.save(entities);
  }
}
