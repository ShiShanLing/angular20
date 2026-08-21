import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 254, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 200 })
  password!: string;

  @Column({ type: 'varchar', length: 36, unique: true, nullable: true })
  agentUserId!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  nickname!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
