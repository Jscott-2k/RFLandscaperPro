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

import { Company } from '../../companies/entities/company.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Job } from '../../jobs/entities/job.entity';

export enum ContractFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'bi-weekly',
  MONTHLY = 'monthly',
  BIMONTHLY = 'bi-monthly',
}

@Entity()
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.contracts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Customer, (customer) => customer.contracts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  customer: Customer;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ nullable: true, type: 'date' })
  endDate?: Date;

  @Column({ enum: ContractFrequency, type: 'enum' })
  frequency: ContractFrequency;

  @Column({ nullable: true, type: 'int' })
  totalOccurrences?: number;

  @Column({ default: 0, type: 'int' })
  occurrencesGenerated: number;

  @Column({ type: 'jsonb' })
  jobTemplate: {
    title: string;
    description?: string;
    estimatedHours?: number;
    notes?: string;
  };

  @Column({ nullable: true, type: 'date' })
  lastGeneratedDate?: Date;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Job, (job) => job.contract)
  jobs: Job[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
