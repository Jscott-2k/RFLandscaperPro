import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';

import { Company } from '../../companies/entities/company.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { User } from '../../users/user.entity';
import { Job } from './job.entity';

@Entity()
@Index(['user', 'job']) // Add index for user-job queries
@Index(['equipment', 'job']) // Add index for equipment-job queries
@Index(['companyId']) // Add index for company-based queries
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Job, (job) => job.assignments, { onDelete: 'CASCADE' })
  job: Job;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Equipment, { onDelete: 'CASCADE' })
  equipment: Equipment;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ nullable: true, type: 'timestamp' })
  startTime?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  endTime?: Date;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;
}
