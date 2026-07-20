import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Notebook } from './notebook.entity';

@Entity('notes')
@Index(['userId', 'notebookId'])
export class Note {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  userId!: number;

  @Column({ type: 'integer', nullable: true })
  notebookId!: number | null;

  @Column({ type: 'varchar', length: 200, default: '无标题' })
  title!: string;

  @Column({ type: 'text', default: '' })
  content!: string;

  @Column({ type: 'boolean', default: false })
  isPinned!: boolean;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Notebook, { nullable: true })
  @JoinColumn({ name: 'notebookId' })
  notebook!: Notebook | null;
}
