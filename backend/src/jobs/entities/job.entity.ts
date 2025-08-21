import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Assignment } from './assignment.entity';

@Entity()
@Index(['scheduledDate', 'completed']) // Add index for common queries
@Index(['customer']) // Add index for customer-based queries
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true })
  scheduledDate?: Date;

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedHours?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualHours?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Customer, (customer) => customer.jobs, { 
    onDelete: 'CASCADE',
    nullable: false 
  })
  customer: Customer;

  @OneToMany(() => Assignment, (assignment) => assignment.job, { 
    cascade: true,
    onDelete: 'CASCADE'
  })
  assignments: Assignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
