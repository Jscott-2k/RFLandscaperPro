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
import * as bcrypt from 'bcrypt';
import { Customer } from '../customers/entities/customer.entity';
import { Company } from '../companies/entities/company.entity';
import { CompanyUser } from '../companies/entities/company-user.entity';
import { Invitation } from '../companies/entities/invitation.entity';
import { Email } from './value-objects/email.vo';
import { PhoneNumber } from './value-objects/phone-number.vo';

export enum UserRole {
  Admin = 'admin',
  Owner = 'owner',
  Worker = 'worker',
  Customer = 'customer',
  Master = 'master',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({
    type: 'varchar',
    unique: true,
    transformer: {
      to: (value: Email): string => value.value,
      from: (value: string): Email => new Email(value),
    },
  })
  email: Email;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Customer })
  role: UserRole;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    transformer: {
      to: (value: PhoneNumber | null): string | null =>
        value ? value.value : null,
      from: (value: string | null): PhoneNumber | null =>
        value ? new PhoneNumber(value) : null,
    },
  })
  phone: PhoneNumber | null;

  @Index('IDX_user_password_reset_token')
  @Column({ type: 'varchar', length: 64, nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpires: Date | null;

  @OneToOne(() => Customer, (customer) => customer.user)
  customer?: Customer;

  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @Column({ nullable: true })
  companyId?: number;

  @OneToMany(
    () => CompanyUser,
    (membership) => membership.user,
  )
  companyMemberships: CompanyUser[];

  @OneToMany(
    () => CompanyUser,
    (membership) => membership.invitedByUser,
  )
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
