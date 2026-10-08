import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** 线上背题题库。按科目整份保存，发布前端时不会覆盖这张表。 */
@Entity('practice_banks')
export class PracticeBank {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  track!: string;

  @Column({ type: 'simple-json' })
  questions!: Record<string, unknown>[];

  @UpdateDateColumn()
  updatedAt!: Date;
}
