import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 一道背题。整份题库按行存放，改一题只更新这一行。 */
@Entity('practice_questions')
@Index(['track', 'questionId'], { unique: true })
export class PracticeQuestion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 32 })
  track!: string;

  @Column({ type: 'varchar', length: 80 })
  questionId!: string;

  @Column({ type: 'simple-json' })
  data!: Record<string, unknown>;

  @UpdateDateColumn()
  updatedAt!: Date;
}
