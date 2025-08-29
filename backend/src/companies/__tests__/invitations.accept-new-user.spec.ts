/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { InvitationsService } from '../invitations.service';
import { Invitation, InvitationRole } from '../entities/invitation.entity';
import { CompanyUser, CompanyUserRole } from '../entities/company-user.entity';
import { User } from '../../users/user.entity';
import { EmailService } from '../../common/email.service';

describe('InvitationsService acceptInvitation', () => {
  let service: InvitationsService;
  let invitationsRepo: jest.Mocked<
    Pick<Repository<Invitation>, 'findOne' | 'save'>
  >;
  let companyUsersRepo: jest.Mocked<
    Pick<Repository<CompanyUser>, 'create' | 'save'>
  >;
  let usersRepo: jest.Mocked<Pick<Repository<User>, 'create' | 'save'>>;
  let emailService: EmailService;

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
      create: jest.fn((dto) => Object.assign(new User(), dto)),
      save: jest.fn(async (u) => {
        u.id = 42;
        return u;
      }),
    } as unknown as jest.Mocked<Pick<Repository<User>, 'create' | 'save'>>;
    emailService = {} as EmailService;
    service = new InvitationsService(
      invitationsRepo as unknown as Repository<Invitation>,
      companyUsersRepo as unknown as Repository<CompanyUser>,
      usersRepo as unknown as Repository<User>,
      emailService,
    );
  });

  it('creates user, membership and marks invitation accepted', async () => {
    const token = 'abc';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      companyId: 7,
      email: 'new@user.com',
      role: InvitationRole.ADMIN,
      tokenHash,
      expiresAt: new Date(Date.now() + 10000),
      invitedBy: 1,
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);

    const user = await service.acceptInvitation(token, {
      name: 'New User',
      password: 'SecurePass123!',
    });

    expect(user.id).toBe(42);
    expect(user.email).toBe('new@user.com');
    expect(companyUsersRepo.create).toHaveBeenCalledWith({
      companyId: 7,
      userId: 42,
      role: CompanyUserRole.ADMIN,
      invitedBy: 1,
    });
    expect(invitation.acceptedAt).toBeInstanceOf(Date);
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
    await expect(
      service.acceptInvitation(token, { name: 'x', password: 'StrongPass1!' }),
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
    await expect(
      service.acceptInvitation(token, { name: 'x', password: 'StrongPass1!' }),
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
      service.acceptInvitation(token, { name: 'x', password: 'StrongPass1!' }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
