import { CompanyUserRole } from '@rflp/shared';
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

import { User } from '../../users/user.entity';
import { Company } from './company.entity';

export { CompanyUserRole } from '@rflp/shared';

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

  @Column({ enum: CompanyUserRole, type: 'enum' })
  role: CompanyUserRole;

  @Column({
    default: CompanyUserStatus.ACTIVE,
    enum: CompanyUserStatus,
    type: 'enum',
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
