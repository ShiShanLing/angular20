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

@Entity('weather_history')
@Index(['userId'], { unique: false })
export class WeatherHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  userId!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'float' })
  lat!: number;

  @Column({ type: 'float' })
  lon!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  admin1!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;
}
