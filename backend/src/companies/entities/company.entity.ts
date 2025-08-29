import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { Job } from '../../jobs/entities/job.entity';
import { Contract } from '../../contracts/entities/contract.entity';
import { CompanyUser } from './company-user.entity';
import { Invitation } from './invitation.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  ownerId?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner?: User;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => CompanyUser, (membership) => membership.company)
  memberships: CompanyUser[];

  @OneToMany(() => Invitation, (invitation) => invitation.company)
  invitations: Invitation[];

  @OneToMany(() => Customer, (customer) => customer.company)
  customers: Customer[];

  @OneToMany(() => Equipment, (equipment) => equipment.company)
  equipment: Equipment[];

  @OneToMany(() => Job, (job) => job.company)
  jobs: Job[];

  @OneToMany(() => Contract, (contract) => contract.company)
  contracts: Contract[];
}
