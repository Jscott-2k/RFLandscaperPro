import { Job } from '../../jobs/entities/job.entity';
import { Address } from './address.entity';

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

@Entity()
@Index(['email']) // Add index for email queries
@Index(['name']) // Add index for name queries
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Job, (job) => job.customer, { onDelete: 'CASCADE' })
  jobs: Job[];

  @OneToMany(() => Address, (address) => address.customer, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  addresses: Address[];
}
