import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { User } from '../../users/user.entity';
import { Company } from './company.entity';

export enum InvitationRole {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
}

@Entity('invitation')
@Index('IDX_invitation_companyId', ['companyId'])
@Index('IDX_invitation_email', ['email'])
@Index('IDX_invitation_expiresAt', ['expiresAt'])
@Index('IDX_invitation_active_unique', ['companyId', 'email'], {
  unique: true,
  where: '"acceptedAt" IS NULL AND "revokedAt" IS NULL',
})
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.invitations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  email: string;

  @Column({ enum: InvitationRole, type: 'enum' })
  role: InvitationRole;

  @Column({ length: 128, type: 'varchar' })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  acceptedAt?: Date | null;

  @Column({ nullable: true, type: 'timestamptz' })
  revokedAt?: Date | null;

  @Column()
  invitedBy: number;

  @ManyToOne(() => User, (user) => user.sentInvitations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invitedBy' })
  invitedByUser: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
