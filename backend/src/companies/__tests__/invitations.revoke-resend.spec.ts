import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { InvitationsService } from '../invitations.service';
import { Invitation, InvitationRole } from '../entities/invitation.entity';
import { CompanyUser } from '../entities/company-user.entity';
import { Company } from '../entities/company.entity';
import { User } from '../../users/user.entity';
import { EmailService } from '../../common/email.service';

describe('InvitationsService revoke and resend', () => {
  let invitationsRepo: jest.Mocked<Pick<Repository<Invitation>, 'findOne' | 'save'>>;
  let service: InvitationsService;
  let emailService: {
    sendCompanyInvitationEmail: jest.Mock<
      void,
      [string, string, string, InvitationRole, Date]
    >;
  };

  beforeEach(() => {
    invitationsRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (inv) => inv),
    } as unknown as jest.Mocked<Pick<Repository<Invitation>, 'findOne' | 'save'>>;
    emailService = {
      sendCompanyInvitationEmail: jest.fn(),
    } as {
      sendCompanyInvitationEmail: jest.Mock<
        void,
        [string, string, string, InvitationRole, Date]
      >;
    };
    service = new InvitationsService(
      invitationsRepo as unknown as Repository<Invitation>,
      {} as unknown as Repository<CompanyUser>,
      {} as unknown as Repository<User>,
      {} as unknown as Repository<Company>,
      emailService as unknown as EmailService,
    );
  });

  it('revoked tokens cannot be accepted', async () => {
    const token = 'abc';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      id: 1,
      companyId: 2,
      email: 'a@b.com',
      role: InvitationRole.WORKER,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000),
    });
    invitationsRepo.findOne.mockImplementation(async (opts: any) => {
      const where = opts.where ?? opts;
      if (where.id === 1 && where.companyId === 2) return invitation;
      if (where.tokenHash === invitation.tokenHash) return invitation;
      return null;
    });

    await service.revokeInvitation(2, 1);

    await expect(
      service.acceptExistingUser(token, { userId: 5, email: 'a@b.com' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('resend rotates token and expiry', async () => {
    const token = 'old';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      id: 3,
      companyId: 4,
      email: 'resend@ex.com',
      role: InvitationRole.ADMIN,
      tokenHash,
      expiresAt: new Date(Date.now() - 1000),
      company: { name: 'Co' } as any,
    });
    invitationsRepo.findOne.mockImplementation(async (opts: any) => {
      const where = opts.where ?? opts;
      if (where.id === 3 && where.companyId === 4) return invitation;
      if (where.tokenHash === invitation.tokenHash) return invitation;
      return null;
    });

    await service.resendInvitation(4, 3);
    const [[email, newToken, companyName, role, expiry]] =
      emailService.sendCompanyInvitationEmail.mock.calls;
    expect(email).toBe('resend@ex.com');
    expect(companyName).toBe('Co');
    expect(role).toBe(InvitationRole.ADMIN);
    expect(expiry).toBeInstanceOf(Date);
    const newHash = crypto.createHash('sha256').update(newToken).digest('hex');
    expect(invitation.tokenHash).toBe(newHash);
    expect(invitation.expiresAt.getTime()).toBeGreaterThan(Date.now());

    await expect(service.previewInvitation(token)).rejects.toMatchObject({ status: 404 });
    const preview = await service.previewInvitation(newToken);
    expect(preview.status).toBe('valid');
  });
});

