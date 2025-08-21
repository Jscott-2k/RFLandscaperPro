import { Job } from '../../jobs/entities/job.entity';
import { Address } from './address.entity';

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/company.entity';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Job, (job) => job.customer)
  jobs: Job[];

  @OneToMany(() => Address, (address) => address.customer, {
  cascade: true,
  eager: true,
  })
  addresses: Address[];

  @ManyToOne(() => Company, (company) => company.customers, { nullable: false })
  @JoinColumn({ name: 'companyId' })
  company: Company;

}
