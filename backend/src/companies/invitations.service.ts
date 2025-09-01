import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'node:crypto';
import { type Repository, MoreThan, IsNull, QueryFailedError } from 'typeorm';

import { validatePasswordStrength } from '../auth/password.util';
import { EmailService } from '../common/email';
import { invitationMail, addedToCompanyMail } from '../common/email/templates';
import { MetricsService } from '../metrics/metrics.service';
import { User, UserRole } from '../users/user.entity';
import { Email } from '../users/value-objects/email.vo';
import { PhoneNumber } from '../users/value-objects/phone-number.vo';
import { type AcceptInvitationDto } from './dto/accept-invitation.dto';
import { type CreateInvitationDto } from './dto/create-invitation.dto';
import {
  CompanyUser,
  CompanyUserStatus,
  CompanyUserRole,
} from './entities/company-user.entity';
import { Company } from './entities/company.entity';
import { Invitation, InvitationRole } from './entities/invitation.entity';

@Injectable()
export class InvitationsService {
  private readonly RATE_LIMIT = 5;
  private readonly RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  private readonly ACCEPT_RATE_LIMIT = 5;
  private readonly ACCEPT_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  private readonly acceptAttempts = new Map<
    string,
    { count: number; firstAttempt: number }
  >();

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationsRepository: Repository<Invitation>,
    @InjectRepository(CompanyUser)
    private readonly companyUsersRepository: Repository<CompanyUser>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    private readonly emailService: EmailService,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async createInvitation(
    companyId: number,
    dto: CreateInvitationDto,
    inviter: User,
  ): Promise<Invitation> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      const membership = await this.companyUsersRepository.findOne({
        where: {
          companyId,
          status: CompanyUserStatus.ACTIVE,
          userId: existingUser.id,
        },
      });
      if (membership) {
        throw new ConflictException('User is already a member of this company');
      }
    }

    const existingInvitation = await this.invitationsRepository.findOne({
      where: {
        acceptedAt: IsNull(),
        companyId,
        email: dto.email.toLowerCase(),
        revokedAt: IsNull(),
      },
    });
    if (existingInvitation) {
      throw new ConflictException('Invitation already pending for this email');
    }

    const since = new Date(Date.now() - this.RATE_WINDOW_MS);
    const recentCount = await this.invitationsRepository.count({
      where: {
        companyId,
        createdAt: MoreThan(since),
        invitedBy: inviter.id,
      },
    });
    if (recentCount >= this.RATE_LIMIT) {
      throw new HttpException(
        'Too many invitations sent. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = this.invitationsRepository.create({
      companyId,
      email: dto.email.toLowerCase(),
      expiresAt,
      invitedBy: inviter.id,
      role: dto.role,
      tokenHash,
    });

    const saved = await this.invitationsRepository.save(invitation);

    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });
    await this.emailService.send(
      invitationMail(
        dto.email,
        rawToken,
        company?.name ?? 'Your company',
        dto.role,
        invitation.expiresAt,
      ),
    );
    this.metrics?.incrementCounter('invitations_sent_total', {
      companyId,
      route: 'invitations.create',
      status: 'sent',
    });
    return saved;
  }

  async revokeInvitation(
    companyId: number,
    invitationId: number,
  ): Promise<void> {
    const invitation = await this.invitationsRepository.findOne({
      where: { companyId, id: invitationId },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.acceptedAt || invitation.revokedAt) {
      throw new BadRequestException('Invitation cannot be revoked');
    }
    invitation.revokedAt = new Date();
    await this.invitationsRepository.save(invitation);
  }

  async resendInvitation(
    companyId: number,
    invitationId: number,
  ): Promise<Invitation> {
    const invitation = await this.invitationsRepository.findOne({
      relations: ['company'],
      where: {
        acceptedAt: IsNull(),
        companyId,
        id: invitationId,
        revokedAt: IsNull(),
      },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    invitation.tokenHash = tokenHash;
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.invitationsRepository.save(invitation);
    await this.emailService.send(
      invitationMail(
        invitation.email,
        rawToken,
        invitation.company?.name ?? 'Your company',
        invitation.role,
        invitation.expiresAt,
      ),
    );
    return invitation;
  }

  async previewInvitation(token: string): Promise<{
    companyName: string;
    email: string;
    role: InvitationRole;
    status: 'valid' | 'expired' | 'revoked' | 'accepted';
  }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = await this.invitationsRepository.findOne({
      relations: ['company'],
      where: { tokenHash },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    let status: 'valid' | 'expired' | 'revoked' | 'accepted';
    if (invitation.acceptedAt) {status = 'accepted';}
    else if (invitation.revokedAt) {status = 'revoked';}
    else if (invitation.expiresAt.getTime() < Date.now()) {status = 'expired';}
    else {status = 'valid';}

    return {
      companyName: invitation.company.name,
      email: invitation.email,
      role: invitation.role,
      status,
    };
  }

  private checkAcceptRateLimit(tokenHash: string) {
    const now = Date.now();
    const record = this.acceptAttempts.get(tokenHash);
    if (record && now - record.firstAttempt < this.ACCEPT_RATE_WINDOW_MS) {
      if (record.count >= this.ACCEPT_RATE_LIMIT) {
        throw new HttpException(
          'Too many acceptance attempts. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      record.count += 1;
    } else {
      this.acceptAttempts.set(tokenHash, { count: 1, firstAttempt: now });
    }
  }

  async acceptExistingUser(
    token: string,
    currentUser: { userId: number; email: string },
  ): Promise<User> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    this.checkAcceptRateLimit(tokenHash);

    const invitation = await this.invitationsRepository.findOne({
      where: { tokenHash },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (
      invitation.acceptedAt ||
      invitation.revokedAt ||
      invitation.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invitation token is invalid');
    }

    if (currentUser.email !== invitation.email) {
      throw new ForbiddenException('Invitation email mismatch');
    }

    const user = await this.usersRepository.findOne({
      where: { id: currentUser.userId },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    user.companyId = invitation.companyId;
    await this.usersRepository.save(user);

    const membership = this.companyUsersRepository.create({
      companyId: invitation.companyId,
      invitedBy: invitation.invitedBy,
      role:
        invitation.role === InvitationRole.ADMIN
          ? CompanyUserRole.ADMIN
          : CompanyUserRole.WORKER,
      userId: user.id,
    });
    await this.companyUsersRepository.save(membership);

    invitation.acceptedAt = new Date();
    await this.invitationsRepository.save(invitation);

    const company = await this.companiesRepository.findOne({
      where: { id: invitation.companyId },
    });
    await this.emailService.send(
      addedToCompanyMail(
        user.email.value,
        company?.name ?? 'Your company',
        invitation.role,
      ),
    );

    this.acceptAttempts.delete(tokenHash);
    this.metrics?.incrementCounter('invitations_accepted_total', {
      companyId: invitation.companyId,
      route: 'invitations.accept',
      status: 'accepted',
    });
    return user;
  }

  async acceptInvitation(
    token: string,
    dto: AcceptInvitationDto,
  ): Promise<User> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    this.checkAcceptRateLimit(tokenHash);

    const invitation = await this.invitationsRepository.findOne({
      where: { tokenHash },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (
      invitation.acceptedAt ||
      invitation.revokedAt ||
      invitation.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invitation token is invalid');
    }

    validatePasswordStrength(dto.password);

    const user = this.usersRepository.create({
      companyId: invitation.companyId,
      email: new Email(invitation.email),
      isVerified: true,
      password: dto.password,
      role: UserRole.Worker,
      username: dto.name,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ? new PhoneNumber(dto.phone) : undefined,
    });

    let savedUser: User;
    try {
      savedUser = await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const { code } = error.driverError as { code?: string };
        if (code === '23505') {
          throw new ConflictException('Username or email already exists');
        }
      }
      throw error;
    }

    const membership = this.companyUsersRepository.create({
      companyId: invitation.companyId,
      invitedBy: invitation.invitedBy,
      role:
        invitation.role === InvitationRole.ADMIN
          ? CompanyUserRole.ADMIN
          : CompanyUserRole.WORKER,
      userId: savedUser.id,
    });
    await this.companyUsersRepository.save(membership);

    invitation.acceptedAt = new Date();
    await this.invitationsRepository.save(invitation);

    const company = await this.companiesRepository.findOne({
      where: { id: invitation.companyId },
    });

    await this.emailService.send(
      addedToCompanyMail(
        savedUser.email.value,
        company?.name ?? 'Your company',
        invitation.role,
      ),
    );

    this.acceptAttempts.delete(tokenHash);
    this.metrics?.incrementCounter('invitations_accepted_total', {
      companyId: invitation.companyId,
      route: 'invitations.accept',
      status: 'accepted',
    });
    return savedUser;
  }
}
