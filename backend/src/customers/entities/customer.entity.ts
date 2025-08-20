import { Job } from '../../jobs/entities/job.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Address } from './address.entity';

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

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

  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices: Invoice[];

  @OneToMany(() => Payment, (payment) => payment.customer)
  payments: Payment[];

  @OneToMany(() => Address, (address) => address.customer, {
  cascade: true,
  eager: true,
  })
  addresses: Address[];

}
