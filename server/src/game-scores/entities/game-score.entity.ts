import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('game_scores')
@Index(['userId', 'game'])
export class GameScore {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  userId!: number;

  @Column({ type: 'varchar', length: 20 })
  game!: string; // snake, tetris

  @Column({ type: 'integer' })
  score!: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  playedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;
}
