import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** 某个账号标过星的一道题。取消标星就删掉这一行。 */
@Entity('practice_stars')
@Index(['userId', 'track', 'questionId'], { unique: true })
export class PracticeStar {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  userId!: number;

  @Column({ type: 'varchar', length: 32 })
  track!: string;

  @Column({ type: 'varchar', length: 80 })
  questionId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
