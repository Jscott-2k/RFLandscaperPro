import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Assignment } from './assignment.entity';
import { Company } from '../../companies/company.entity';

@Entity()
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

  @ManyToOne(() => Customer, (customer) => customer.jobs, { eager: true })
  customer: Customer;

  @ManyToOne(() => Company, (company) => company.jobs, { nullable: false })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => Assignment, (assignment) => assignment.job, { eager: true })
  assignments: Assignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
