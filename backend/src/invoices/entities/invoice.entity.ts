import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Job, (job) => job.invoices, { eager: true })
  job: Job;

  @ManyToOne(() => Customer, (customer) => customer.invoices, { eager: true })
  customer: Customer;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @OneToMany(() => Payment, (payment) => payment.invoice, {
    cascade: true,
  })
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
