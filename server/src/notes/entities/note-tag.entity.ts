import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Note } from './note.entity';

@Entity('note_tags')
@Index(['noteId'])
export class NoteTag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  noteId!: number;

  @Column({ type: 'varchar', length: 50 })
  tagName!: string;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note!: Note;
}
