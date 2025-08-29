import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, QueryFailedError } from 'typeorm';
import { Invitation, InvitationRole } from './entities/invitation.entity';
import {
  CompanyUser,
  CompanyUserStatus,
  CompanyUserRole,
} from './entities/company-user.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import * as crypto from 'crypto';
import { EmailService } from '../common/email.service';
import { validatePasswordStrength } from '../auth/password.util';

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
    private readonly emailService: EmailService,
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
          userId: existingUser.id,
          status: CompanyUserStatus.ACTIVE,
        },
      });
      if (membership) {
        throw new ConflictException('User is already a member of this company');
      }
    }

    const existingInvitation = await this.invitationsRepository.findOne({
      where: {
        companyId,
        email: dto.email.toLowerCase(),
        acceptedAt: IsNull(),
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
        invitedBy: inviter.id,
        createdAt: MoreThan(since),
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
      role: dto.role,
      tokenHash,
      expiresAt,
      invitedBy: inviter.id,
    });

    const saved = await this.invitationsRepository.save(invitation);

    await this.emailService.sendCompanyInvitationEmail(dto.email, rawToken);

    return saved;
  }

  async previewInvitation(
    token: string,
  ): Promise<{
    companyName: string;
    email: string;
    role: InvitationRole;
    status: 'valid' | 'expired' | 'revoked' | 'accepted';
  }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = await this.invitationsRepository.findOne({
      where: { tokenHash },
      relations: ['company'],
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    let status: 'valid' | 'expired' | 'revoked' | 'accepted';
    if (invitation.acceptedAt) status = 'accepted';
    else if (invitation.revokedAt) status = 'revoked';
    else if (invitation.expiresAt.getTime() < Date.now()) status = 'expired';
    else status = 'valid';

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
      username: dto.name,
      email: invitation.email,
      password: dto.password,
      role: UserRole.Worker,
      isVerified: true,
      companyId: invitation.companyId,
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
      userId: savedUser.id,
      role:
        invitation.role === InvitationRole.ADMIN
          ? CompanyUserRole.ADMIN
          : CompanyUserRole.WORKER,
      invitedBy: invitation.invitedBy,
    });
    await this.companyUsersRepository.save(membership);

    invitation.acceptedAt = new Date();
    await this.invitationsRepository.save(invitation);

    this.acceptAttempts.delete(tokenHash);

    return savedUser;
  }
}
