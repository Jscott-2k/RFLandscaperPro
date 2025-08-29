import { Job } from '../../jobs/entities/job.entity';
import { Contract } from '../../contracts/entities/contract.entity';
import { Address } from './address.entity';
import { User } from '../../users/user.entity';
import { Company } from '../../companies/entities/company.entity';

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
  ManyToOne,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['email', 'companyId'])
@Index(['email']) // Add index for email queries
@Index(['name']) // Add index for name queries
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.customers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ nullable: true })
  userId?: number;

  @OneToOne(() => User, (user) => user.customer, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Job, (job) => job.customer, { onDelete: 'CASCADE' })
  jobs: Job[];

  @OneToMany(() => Contract, (contract) => contract.customer, {
    onDelete: 'CASCADE',
  })
  contracts: Contract[];

  @OneToMany(() => Address, (address) => address.customer, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  addresses: Address[];
}
