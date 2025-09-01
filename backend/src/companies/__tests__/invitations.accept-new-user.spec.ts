import * as crypto from 'node:crypto';
import { type SendMailOptions } from 'nodemailer';
import { type Repository } from 'typeorm';

import { type EmailService } from '../../common/email';
import { User } from '../../users/user.entity';
import { CompanyUser, CompanyUserRole } from '../entities/company-user.entity';
import { Company } from '../entities/company.entity';
import { Invitation, InvitationRole } from '../entities/invitation.entity';
import { InvitationsService } from '../invitations.service';

describe('InvitationsService acceptInvitation', () => {
  let service: InvitationsService;
  let invitationsRepo: jest.Mocked<
    Pick<Repository<Invitation>, 'findOne' | 'save'>
  >;
  let companyUsersRepo: jest.Mocked<
    Pick<Repository<CompanyUser>, 'create' | 'save'>
  >;
  let usersRepo: jest.Mocked<Pick<Repository<User>, 'create' | 'save'>>;
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
      create: jest.fn((dto: Partial<User>) => Object.assign(new User(), dto)),
      save: jest.fn((u: User) => {
        u.id = 42;
        return Promise.resolve(u);
      }),
    } as unknown as jest.Mocked<Pick<Repository<User>, 'create' | 'save'>>;
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

  it('creates user, membership and marks invitation accepted', async () => {
    const token = 'abc';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      companyId: 7,
      email: 'new@user.com',
      expiresAt: new Date(Date.now() + 10000),
      invitedBy: 1,
      role: InvitationRole.ADMIN,
      tokenHash,
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);

    const user = await service.acceptInvitation(token, {
      name: 'New User',
      password: 'SecurePass123!',
    });

    expect(user.id).toBe(42);
    expect(user.email.value).toBe('new@user.com');
    expect(companyUsersRepo.create).toHaveBeenCalledWith({
      companyId: 7,
      invitedBy: 1,
      role: CompanyUserRole.ADMIN,
      userId: 42,
    });
    expect(invitation.acceptedAt).toBeInstanceOf(Date);
    const [[options]] = emailService.send.mock.calls;
    expect(options.to).toBe('new@user.com');
    expect(options.subject).toBe('You were added to a company');
    expect(options.html as string).toContain('Co');
    expect(options.html as string).toContain('Admin');
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
    await expect(
      service.acceptInvitation(token, { name: 'x', password: 'StrongPass1!' }),
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
    await expect(
      service.acceptInvitation(token, { name: 'x', password: 'StrongPass1!' }),
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
      service.acceptInvitation(token, { name: 'x', password: 'StrongPass1!' }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
