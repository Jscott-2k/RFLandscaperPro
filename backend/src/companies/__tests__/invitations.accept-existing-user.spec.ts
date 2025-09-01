import * as crypto from 'node:crypto';
import { type SendMailOptions } from 'nodemailer';
import { type Repository } from 'typeorm';

import { type EmailService } from '../../common/email';
import { User } from '../../users/user.entity';
import { Email } from '../../users/value-objects/email.vo';
import { CompanyUser, CompanyUserRole } from '../entities/company-user.entity';
import { Company } from '../entities/company.entity';
import { Invitation, InvitationRole } from '../entities/invitation.entity';
import { InvitationsService } from '../invitations.service';

describe('InvitationsService acceptExistingUser', () => {
  let service: InvitationsService;
  let invitationsRepo: jest.Mocked<
    Pick<Repository<Invitation>, 'findOne' | 'save'>
  >;
  let companyUsersRepo: jest.Mocked<
    Pick<Repository<CompanyUser>, 'create' | 'save'>
  >;
  let usersRepo: jest.Mocked<Pick<Repository<User>, 'findOne' | 'save'>>;
  let companiesRepo: jest.Mocked<Pick<Repository<Company>, 'findOne'>>;
  let emailService: { send: jest.Mock<void, [SendMailOptions]> };

  beforeEach(() => {
    invitationsRepo = {
      findOne: jest.fn(),
      save: jest.fn((inv: Invitation) => Promise.resolve(inv)),
    } as unknown as jest.Mocked<
      Pick<Repository<Invitation>, 'findOne' | 'save'>
    >;
    companyUsersRepo = {
      create: jest.fn((dto: Partial<CompanyUser>) =>
        Object.assign(new CompanyUser(), dto),
      ),
      save: jest.fn((m: CompanyUser) => Promise.resolve(m)),
    } as unknown as jest.Mocked<
      Pick<Repository<CompanyUser>, 'create' | 'save'>
    >;
    usersRepo = {
      findOne: jest.fn(),
      save: jest.fn((u: User) => Promise.resolve(u)),
    } as unknown as jest.Mocked<Pick<Repository<User>, 'findOne' | 'save'>>;
    companiesRepo = {
      findOne: jest.fn(() =>
        Promise.resolve(Object.assign(new Company(), { id: 7, name: 'Co' })),
      ),
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
      expiresAt: new Date(Date.now() + 10000),
      invitedBy: 1,
      role: InvitationRole.ADMIN,
      tokenHash,
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);
    usersRepo.findOne.mockResolvedValue(
      Object.assign(new User(), {
        email: new Email('existing@user.com'),
        id: 5,
      }),
    );

    const user = await service.acceptExistingUser(token, {
      email: 'existing@user.com',
      userId: 5,
    });

    expect(user.companyId).toBe(7);
    expect(companyUsersRepo.create).toHaveBeenCalledWith({
      companyId: 7,
      invitedBy: 1,
      role: CompanyUserRole.ADMIN,
      userId: 5,
    });
    expect(invitation.acceptedAt).toBeInstanceOf(Date);
    const [[options]] = emailService.send.mock.calls;
    expect(options.to).toBe('existing@user.com');
    expect(options.subject).toBe('You were added to a company');
    expect(options.html as string).toContain('Co');
    expect(options.html as string).toContain('Admin');
  });

  it('rejects when email mismatch', async () => {
    const token = 'tok';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      companyId: 7,
      email: 'invited@user.com',
      expiresAt: new Date(Date.now() + 10000),
      role: InvitationRole.WORKER,
      tokenHash,
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);
    usersRepo.findOne.mockResolvedValue(
      Object.assign(new User(), {
        email: new Email('invited@user.com'),
        id: 5,
      }),
    );
    await expect(
      service.acceptExistingUser(token, {
        email: 'other@user.com',
        userId: 5,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('rejects expired token', async () => {
    const token = 'expired';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      companyId: 1,
      email: 'a@b.com',
      expiresAt: new Date(Date.now() - 1000),
      role: InvitationRole.WORKER,
      tokenHash,
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);
    usersRepo.findOne.mockResolvedValue(
      Object.assign(new User(), { email: new Email('a@b.com'), id: 1 }),
    );
    await expect(
      service.acceptExistingUser(token, {
        email: 'a@b.com',
        userId: 1,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects revoked or used token', async () => {
    const token = 'revoked';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      companyId: 1,
      email: 'a@b.com',
      expiresAt: new Date(Date.now() + 1000),
      revokedAt: new Date(),
      role: InvitationRole.WORKER,
      tokenHash,
    });
    invitationsRepo.findOne.mockResolvedValueOnce(invitation);
    usersRepo.findOne.mockResolvedValue(
      Object.assign(new User(), { email: new Email('a@b.com'), id: 1 }),
    );
    await expect(
      service.acceptExistingUser(token, {
        email: 'a@b.com',
        userId: 1,
      }),
    ).rejects.toMatchObject({ status: 400 });

    const used = Object.assign(new Invitation(), {
      acceptedAt: new Date(),
      companyId: 1,
      email: 'a@b.com',
      expiresAt: new Date(Date.now() + 1000),
      role: InvitationRole.WORKER,
      tokenHash,
    });
    invitationsRepo.findOne.mockResolvedValueOnce(used);
    await expect(
      service.acceptExistingUser(token, {
        email: 'a@b.com',
        userId: 1,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
