import * as crypto from 'node:crypto';
import { type SendMailOptions } from 'nodemailer';
import { type Repository, type FindOneOptions } from 'typeorm';

import { type EmailService } from '../../common/email';
import { type User } from '../../users/user.entity';
import { type CompanyUser } from '../entities/company-user.entity';
import { Company } from '../entities/company.entity';
import { Invitation, InvitationRole } from '../entities/invitation.entity';
import { InvitationsService } from '../invitations.service';

describe('InvitationsService revoke and resend', () => {
  let invitationsRepo: jest.Mocked<
    Pick<Repository<Invitation>, 'findOne' | 'save'>
  >;
  let service: InvitationsService;
  let emailService: { send: jest.Mock<void, [SendMailOptions]> };

  beforeEach(() => {
    invitationsRepo = {
      findOne: jest.fn(),
      save: jest.fn((inv) => Promise.resolve(inv)),
    } as unknown as jest.Mocked<
      Pick<Repository<Invitation>, 'findOne' | 'save'>
    >;
    emailService = {
      send: jest.fn<void, [SendMailOptions]>(),
    } as { send: jest.Mock<void, [SendMailOptions]> };
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
      companyId: 2,
      email: 'a@b.com',
      expiresAt: new Date(Date.now() + 1000),
      id: 1,
      role: InvitationRole.WORKER,
      tokenHash,
    });
    invitationsRepo.findOne.mockImplementation(
      (options: FindOneOptions<Invitation>) => {
        const where = (options.where ??
          (options as unknown)) as Partial<Invitation>;
        if (where.id === 1 && where.companyId === 2) {
          return Promise.resolve(invitation);
        }
        if (where.tokenHash === invitation.tokenHash) {
          return Promise.resolve(invitation);
        }
        return Promise.resolve(null);
      },
    );

    await service.revokeInvitation(2, 1);

    await expect(
      service.acceptExistingUser(token, { email: 'a@b.com', userId: 5 }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('resend rotates token and expiry', async () => {
    const token = 'old';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = Object.assign(new Invitation(), {
      company: Object.assign(new Company(), { name: 'Co' }),
      companyId: 4,
      email: 'resend@ex.com',
      expiresAt: new Date(Date.now() - 1000),
      id: 3,
      role: InvitationRole.ADMIN,
      tokenHash,
    });
    invitationsRepo.findOne.mockImplementation(
      (options: FindOneOptions<Invitation>) => {
        const where = (options.where ??
          (options as unknown)) as Partial<Invitation>;
        if (where.id === 3 && where.companyId === 4) {
          return Promise.resolve(invitation);
        }
        if (where.tokenHash === invitation.tokenHash) {
          return Promise.resolve(invitation);
        }
        return Promise.resolve(null);
      },
    );

    await service.resendInvitation(4, 3);
    const [[options]] = emailService.send.mock.calls;
    const tokenMatch = (options.html as string).match(/token=([\w]+)/);
    const newToken = tokenMatch ? tokenMatch[1] : '';
    expect(options.to).toBe('resend@ex.com');
    expect(options.subject).toBe('Company Invitation');
    const newHash = crypto.createHash('sha256').update(newToken).digest('hex');
    expect(invitation.tokenHash).toBe(newHash);
    expect(invitation.expiresAt.getTime()).toBeGreaterThan(Date.now());

    await expect(service.previewInvitation(token)).rejects.toMatchObject({
      status: 404,
    });
    const preview = await service.previewInvitation(newToken);
    expect(preview.status).toBe('valid');
  });
});
