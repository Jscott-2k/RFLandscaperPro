import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';

import { Company } from '../../companies/entities/company.entity';
import { Customer } from './customer.entity';

@Entity()
@Index(['street', 'city', 'state', 'zip']) // Add composite index for address lookups
@Index(['companyId']) // Add index for company-based queries
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  street: string;

  @Column()
  city: string;

  @Column({ length: 2 }) // State should be 2 characters (e.g., CA, NY)
  state: string;

  @Column({ length: 10 }) // ZIP code with optional +4 format
  zip: string;

  @Column({ nullable: true })
  unit?: string;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ default: true, type: 'boolean' })
  primary: boolean;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Customer, (customer) => customer.addresses, {
    onDelete: 'CASCADE',
  })
  customer: Customer;
}
