import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('market_reports')
@Index(['date'], { unique: true })
export class MarketReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 10 })
  date!: string; // "2026-07-17"

  @Column({ type: 'integer', nullable: true })
  aiIndex!: number;

  @Column({ type: 'integer', nullable: true })
  kwIndex!: number;

  @Column({ type: 'integer', default: 0 })
  totalPosts!: number;

  @Column({ type: 'integer', default: 0 })
  bullish!: number;

  @Column({ type: 'integer', default: 0 })
  bearish!: number;

  @Column({ type: 'integer', default: 0 })
  fear!: number;

  @Column({ type: 'integer', default: 0 })
  greed!: number;

  @Column({ type: 'integer', default: 0 })
  neutral!: number;

  @Column({ type: 'float', default: 0 })
  bearFearPct!: number;

  @Column({ type: 'integer', default: 0 })
  panicTotal!: number;

  @Column({ type: 'simple-json', nullable: true })
  sectors!: any;

  @Column({ type: 'text', nullable: true })
  htmlContent!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
