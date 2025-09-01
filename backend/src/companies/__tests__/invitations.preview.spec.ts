import * as crypto from 'node:crypto';
import { type Repository } from 'typeorm';

import { type EmailService } from '../../common/email';
import { type User } from '../../users/user.entity';
import { type CompanyUser } from '../entities/company-user.entity';
import { Company } from '../entities/company.entity';
import { Invitation, InvitationRole } from '../entities/invitation.entity';
import { InvitationsService } from '../invitations.service';

describe('InvitationsService previewInvitation', () => {
  let service: InvitationsService;
  let invitationsRepo: jest.Mocked<Pick<Repository<Invitation>, 'findOne'>>;

  beforeEach(() => {
    invitationsRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Pick<Repository<Invitation>, 'findOne'>>;

    service = new InvitationsService(
      invitationsRepo as unknown as Repository<Invitation>,
      {} as unknown as Repository<CompanyUser>,
      {} as unknown as Repository<User>,
      {} as unknown as Repository<Company>,
      {} as unknown as EmailService,
    );
  });

  it('returns valid status for active invitation', async () => {
    const invitation = Object.assign(new Invitation(), {
      company: Object.assign(new Company(), { name: 'ACME' }),
      email: 'worker@example.com',
      expiresAt: new Date(Date.now() + 1000),
      role: InvitationRole.WORKER,
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);

    const result = await service.previewInvitation('tok');

    expect(result).toEqual({
      companyName: 'ACME',
      email: 'worker@example.com',
      role: InvitationRole.WORKER,
      status: 'valid',
    });
    const hash = crypto.createHash('sha256').update('tok').digest('hex');
    expect(invitationsRepo.findOne).toHaveBeenCalledWith({
      relations: ['company'],
      where: { tokenHash: hash },
    });
  });

  it('returns expired status when invitation expired', async () => {
    const invitation = Object.assign(new Invitation(), {
      company: Object.assign(new Company(), { name: 'ACME' }),
      email: 'a@b.com',
      expiresAt: new Date(Date.now() - 1000),
      role: InvitationRole.ADMIN,
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);

    const result = await service.previewInvitation('tok');
    expect(result.status).toBe('expired');
  });

  it('returns revoked status when invitation revoked', async () => {
    const invitation = Object.assign(new Invitation(), {
      company: Object.assign(new Company(), { name: 'ACME' }),
      email: 'a@b.com',
      expiresAt: new Date(Date.now() + 1000),
      revokedAt: new Date(),
      role: InvitationRole.ADMIN,
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);

    const result = await service.previewInvitation('tok');
    expect(result.status).toBe('revoked');
  });

  it('returns accepted status when invitation accepted', async () => {
    const invitation = Object.assign(new Invitation(), {
      acceptedAt: new Date(),
      company: Object.assign(new Company(), { name: 'ACME' }),
      email: 'a@b.com',
      expiresAt: new Date(Date.now() + 1000),
      role: InvitationRole.ADMIN,
    });
    invitationsRepo.findOne.mockResolvedValue(invitation);

    const result = await service.previewInvitation('tok');
    expect(result.status).toBe('accepted');
  });

  it('throws NotFoundException when invitation not found', async () => {
    invitationsRepo.findOne.mockResolvedValue(null);
    await expect(service.previewInvitation('tok')).rejects.toMatchObject({
      status: 404,
    });
  });
});
