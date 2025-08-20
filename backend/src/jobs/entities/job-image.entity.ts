import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Job } from './job.entity';

@Entity()
export class JobImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  path: string;

  @ManyToOne(() => Job, (job) => job.images, { onDelete: 'CASCADE' })
  job: Job;

  @CreateDateColumn()
  createdAt: Date;
}
