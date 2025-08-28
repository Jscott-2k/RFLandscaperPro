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
import { Company } from '../../companies/entities/company.entity';
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
    onDelete: 'CASCADE',
    nullable: false,
  })
  customer: Customer;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'enum', enum: ContractFrequency })
  frequency: ContractFrequency;

  @Column({ type: 'int', nullable: true })
  totalOccurrences?: number;

  @Column({ type: 'int', default: 0 })
  occurrencesGenerated: number;

  @Column({ type: 'jsonb' })
  jobTemplate: {
    title: string;
    description?: string;
    estimatedHours?: number;
    notes?: string;
  };

  @Column({ type: 'date', nullable: true })
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
