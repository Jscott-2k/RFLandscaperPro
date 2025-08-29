import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { Company } from './company.entity';
import { User } from '../../users/user.entity';

export enum CompanyUserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
}

export enum CompanyUserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('company_user')
@Unique('UQ_company_user_companyId_userId', ['companyId', 'userId'])
@Index('IDX_company_user_companyId', ['companyId'])
@Index('IDX_company_user_userId', ['userId'])
export class CompanyUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.companyMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: CompanyUserRole })
  role: CompanyUserRole;

  @Column({
    type: 'enum',
    enum: CompanyUserStatus,
    default: CompanyUserStatus.ACTIVE,
  })
  status: CompanyUserStatus;

  @Column({ nullable: true })
  invitedBy?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invitedBy' })
  invitedByUser?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
