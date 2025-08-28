import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Assignment } from './assignment.entity';
import { Company } from '../../companies/entities/company.entity';
import { Contract } from '../../contracts/entities/contract.entity';

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

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.jobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Customer, (customer) => customer.jobs, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  customer: Customer;

  @OneToMany(() => Assignment, (assignment) => assignment.job, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  assignments: Assignment[];

  @Column({ nullable: true })
  contractId?: number;

  @ManyToOne(() => Contract, (contract) => contract.jobs, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'contractId' })
  contract?: Contract;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
