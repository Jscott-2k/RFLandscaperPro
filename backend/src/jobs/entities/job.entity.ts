import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { JobImage } from './job-image.entity';

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

  @OneToMany(() => JobImage, (image) => image.job, { cascade: true })
  images: JobImage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
