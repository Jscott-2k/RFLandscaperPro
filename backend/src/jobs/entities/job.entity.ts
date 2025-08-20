import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Payment } from '../../payments/entities/payment.entity';

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

  @OneToMany(() => Invoice, (invoice) => invoice.job)
  invoices: Invoice[];

  @OneToMany(() => Payment, (payment) => payment.job)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
