import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** 旧的整份题库。启动时拆进 practice_questions，之后不再往这里写。 */
@Entity('practice_banks')
export class PracticeBank {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  track!: string;

  @Column({ type: 'simple-json' })
  questions!: Record<string, unknown>[];

  @UpdateDateColumn()
  updatedAt!: Date;
}
