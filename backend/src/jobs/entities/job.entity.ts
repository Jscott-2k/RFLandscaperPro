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

import { Company } from '../../companies/entities/company.entity';
import { Contract } from '../../contracts/entities/contract.entity';
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

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true, type: 'date' })
  scheduledDate?: Date;

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true, precision: 10, scale: 2, type: 'decimal' })
  estimatedHours?: number;

  @Column({ nullable: true, precision: 10, scale: 2, type: 'decimal' })
  actualHours?: number;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.jobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Customer, (customer) => customer.jobs, {
    nullable: false,
    onDelete: 'CASCADE',
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
