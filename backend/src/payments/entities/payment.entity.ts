import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Job } from '../../jobs/entities/job.entity';
import { Customer } from '../../customers/entities/customer.entity';

export enum PaymentStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments, { eager: true })
  invoice: Invoice;

  @ManyToOne(() => Job, (job) => job.payments, { eager: true })
  job: Job;

  @ManyToOne(() => Customer, (customer) => customer.payments, { eager: true })
  customer: Customer;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.Pending })
  status: PaymentStatus;

  @Column({ nullable: true })
  paymentProcessor?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
