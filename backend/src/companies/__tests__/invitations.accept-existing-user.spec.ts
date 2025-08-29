/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { InvitationsService } from '../invitations.service';
import { Invitation, InvitationRole } from '../entities/invitation.entity';
import { CompanyUser, CompanyUserRole } from '../entities/company-user.entity';
import { Company } from '../entities/company.entity';
import { User } from '../../users/user.entity';
import { EmailService } from '../../common/email';
import { SendMailOptions } from 'nodemailer';

describe('InvitationsService acceptExistingUser', () => {
  let service: InvitationsService;
  let invitationsRepo: jest.Mocked<Pick<Repository<Invitation>, 'findOne' | 'save'>>;
  let companyUsersRepo: jest.Mocked<
    Pick<Repository<CompanyUser>, 'create' | 'save'>
  >;
  let usersRepo: jest.Mocked<Pick<Repository<User>, 'findOne' | 'save'>>;
  let companiesRepo: jest.Mocked<Pick<Repository<Company>, 'findOne'>>;
  let emailService: { send: jest.Mock<void, [SendMailOptions]> };

  beforeEach(() => {
    invitationsRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (inv) => inv),
    } as unknown as jest.Mocked<Pick<Repository<Invitation>, 'findOne' | 'save'>>;
    companyUsersRepo = {
      create: jest.fn((dto) => Object.assign(new CompanyUser(), dto)),
      save: jest.fn(async (m) => m),
    } as unknown as jest.Mocked<Pick<Repository<CompanyUser>, 'create' | 'save'>>;
    usersRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (u) => u),
    } as unknown as jest.Mocked<Pick<Repository<User>, 'findOne' | 'save'>>;
    companiesRepo = {
      findOne: jest.fn(async () => Object.assign(new Company(), { id: 7, name: 'Co' })),
    } as unknown as jest.Mocked<Pick<Repository<Company>, 'findOne'>>;
    emailService = {
      send: jest.fn<void, [SendMailOptions]>(),
    } as { send: jest.Mock<void, [SendMailOptions]> };
    service = new InvitationsService(
      invitationsRepo as unknown as Repository<Invitation>,
      companyUsersRepo as unknown as Repository<CompanyUser>,
      usersRepo as unknown as Repository<User>,
      companiesRepo as unknown as Repository<Company>,
      emailService as unknown as EmailService,
    );
  });

  it('adds membership for existing user and marks invitation accepted', async () => {
    const token = 'abc';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      companyId: 7,
      email: 'existing@user.com',
      role: InvitationRole.ADMIN,
      tokenHash,
      expiresAt: new Date(Date.now() + 10000),
      invitedBy: 1,
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);
    usersRepo.findOne.mockResolvedValue(
      Object.assign(new User(), { id: 5, email: 'existing@user.com' }),
    );

    const user = await service.acceptExistingUser(token, {
      userId: 5,
      email: 'existing@user.com',
    });

    expect(user.companyId).toBe(7);
    expect(companyUsersRepo.create).toHaveBeenCalledWith({
      companyId: 7,
      userId: 5,
      role: CompanyUserRole.ADMIN,
      invitedBy: 1,
    });
    expect(invitation.acceptedAt).toBeInstanceOf(Date);
    const [[options]] = emailService.send.mock.calls;
    expect(options.to).toBe('existing@user.com');
    expect(options.subject).toBe('You were added to a company');
    expect((options.html as string)).toContain('Co');
    expect((options.html as string)).toContain('Admin');
  });

  it('rejects when email mismatch', async () => {
    const token = 'tok';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      companyId: 7,
      email: 'invited@user.com',
      role: InvitationRole.WORKER,
      tokenHash,
      expiresAt: new Date(Date.now() + 10000),
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);
    usersRepo.findOne.mockResolvedValue(
      Object.assign(new User(), { id: 5, email: 'invited@user.com' }),
    );
    await expect(
      service.acceptExistingUser(token, {
        userId: 5,
        email: 'other@user.com',
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('rejects expired token', async () => {
    const token = 'expired';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      tokenHash,
      companyId: 1,
      email: 'a@b.com',
      role: InvitationRole.WORKER,
      expiresAt: new Date(Date.now() - 1000),
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);
    usersRepo.findOne.mockResolvedValue(
      Object.assign(new User(), { id: 1, email: 'a@b.com' }),
    );
    await expect(
      service.acceptExistingUser(token, {
        userId: 1,
        email: 'a@b.com',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects revoked or used token', async () => {
    const token = 'revoked';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      tokenHash,
      companyId: 1,
      email: 'a@b.com',
      role: InvitationRole.WORKER,
      expiresAt: new Date(Date.now() + 1000),
      revokedAt: new Date(),
    });
    invitationsRepo.findOne.mockResolvedValueOnce(invitation);
    usersRepo.findOne.mockResolvedValue(
      Object.assign(new User(), { id: 1, email: 'a@b.com' }),
    );
    await expect(
      service.acceptExistingUser(token, {
        userId: 1,
        email: 'a@b.com',
      }),
    ).rejects.toMatchObject({ status: 400 });

    const used = Object.assign(new Invitation(), {
      tokenHash,
      companyId: 1,
      email: 'a@b.com',
      role: InvitationRole.WORKER,
      expiresAt: new Date(Date.now() + 1000),
      acceptedAt: new Date(),
    });
    invitationsRepo.findOne.mockResolvedValueOnce(used);
    await expect(
      service.acceptExistingUser(token, {
        userId: 1,
        email: 'a@b.com',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
