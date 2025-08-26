import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Job } from './job.entity';
import { User } from '../../users/user.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';

@Entity()
@Index(['user', 'job']) // Add index for user-job queries
@Index(['equipment', 'job']) // Add index for equipment-job queries
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Job, (job) => job.assignments, { onDelete: 'CASCADE' })
  job: Job;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Equipment, { onDelete: 'CASCADE' })
  equipment: Equipment;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;
}
