import * as bcrypt from 'bcrypt';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  Index,
  OneToOne,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { CompanyUser } from '../companies/entities/company-user.entity';
import { Company } from '../companies/entities/company.entity';
import { Invitation } from '../companies/entities/invitation.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Email } from './value-objects/email.vo';
import { PhoneNumber } from './value-objects/phone-number.vo';

export enum UserRole {
  Master = 'master',
  CompanyAdmin = 'company_admin',
  CompanyOwner = 'company_owner',
  Worker = 'worker',
  Customer = 'customer',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({
    transformer: {
      from: (value: string): Email => new Email(value),
      to: (value: Email): string => value.value,
    },
    type: 'varchar',
    unique: true,
  })
  email: Email;

  @Column()
  password: string;

  @Column({ default: UserRole.Customer, enum: UserRole, type: 'enum' })
  role: UserRole;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true, type: 'varchar' })
  firstName: string | null;

  @Column({ nullable: true, type: 'varchar' })
  lastName: string | null;

  @Column({
    nullable: true,
    transformer: {
      from: (value: string | null): PhoneNumber | null =>
        value ? new PhoneNumber(value) : null,
      to: (value: PhoneNumber | null): string | null =>
        value ? value.value : null,
    },
    type: 'varchar',
  })
  phone: PhoneNumber | null;

  @Index('IDX_user_password_reset_token')
  @Column({ length: 64, nullable: true, type: 'varchar' })
  passwordResetToken: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  passwordResetExpires: Date | null;

  @OneToOne(() => Customer, (customer) => customer.user)
  customer?: Customer;

  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @Column({ nullable: true })
  companyId?: number;

  @OneToMany(() => CompanyUser, (membership) => membership.user)
  companyMemberships: CompanyUser[];

  @OneToMany(() => CompanyUser, (membership) => membership.invitedByUser)
  invitedMemberships: CompanyUser[];

  @OneToMany(() => Invitation, (invitation) => invitation.invitedByUser)
  sentInvitations: Invitation[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    // Only hash if password is not already hashed and has changed
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12); // Increased salt rounds
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
