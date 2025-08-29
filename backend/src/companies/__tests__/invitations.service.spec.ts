/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { InvitationsService } from '../invitations.service';
import { Invitation, InvitationRole } from '../entities/invitation.entity';
import {
  CompanyUser,
  CompanyUserStatus,
} from '../entities/company-user.entity';
import { Company } from '../entities/company.entity';
import { User } from '../../users/user.entity';
import { EmailService } from '../../common/email.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let invitationsRepo: jest.Mocked<
    Pick<Repository<Invitation>, 'create' | 'save' | 'findOne' | 'count'>
  >;
  let companyUsersRepo: jest.Mocked<Pick<Repository<CompanyUser>, 'findOne'>>;
  let usersRepo: jest.Mocked<Pick<Repository<User>, 'findOne'>>;
  let companiesRepo: jest.Mocked<Pick<Repository<Company>, 'findOne'>>;
  let emailService: {
    sendCompanyInvitationEmail: jest.Mock<
      void,
      [string, string, string, InvitationRole, Date]
    >;
  };

  beforeEach(() => {
    invitationsRepo = {
      create: jest.fn((dto) => Object.assign(new Invitation(), dto)),
      save: jest.fn(async (inv) => {
        inv.id = inv.id ?? 1;
        return inv;
      }),
      findOne: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<Repository<Invitation>, 'create' | 'save' | 'findOne' | 'count'>
    >;
    companyUsersRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Pick<Repository<CompanyUser>, 'findOne'>>;
    usersRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Pick<Repository<User>, 'findOne'>>;
    companiesRepo = {
      findOne: jest.fn(async () => Object.assign(new Company(), { id: 5, name: 'Co' })),
    } as unknown as jest.Mocked<Pick<Repository<Company>, 'findOne'>>;
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
      companyUsersRepo as unknown as Repository<CompanyUser>,
      usersRepo as unknown as Repository<User>,
      companiesRepo as unknown as Repository<Company>,
      emailService as unknown as EmailService,
    );
  });

  it('creates invitation, hashes token and sends email', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    invitationsRepo.findOne.mockResolvedValue(null);
    invitationsRepo.count.mockResolvedValue(0);

    const inviter = Object.assign(new User(), { id: 1 });
    const dto = { email: 'worker@example.com', role: InvitationRole.WORKER };

    const invitation = await service.createInvitation(5, dto, inviter);

    const [[email, rawToken, companyName, role, expiry]] =
      emailService.sendCompanyInvitationEmail.mock.calls;
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

    expect(email).toBe('worker@example.com');
    expect(companyName).toBe('Co');
    expect(role).toBe(dto.role);
    expect(expiry).toBeInstanceOf(Date);
    expect(invitation.tokenHash).toBe(hashed);
    expect(invitation.expiresAt).toBeInstanceOf(Date);
  });

  it('rejects inviting existing active member', async () => {
    const existingUser = Object.assign(new User(), {
      id: 10,
      email: 'a@b.com',
    });
    usersRepo.findOne.mockResolvedValue(existingUser);
    companyUsersRepo.findOne.mockResolvedValue(
      Object.assign(new CompanyUser(), { status: CompanyUserStatus.ACTIVE }),
    );

    await expect(
      service.createInvitation(
        2,
        { email: 'a@b.com', role: InvitationRole.ADMIN },
        Object.assign(new User(), { id: 1 }),
      ),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('rate limits invites', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    invitationsRepo.findOne.mockResolvedValue(null);
    invitationsRepo.count.mockResolvedValue(5);

    await expect(
      service.createInvitation(
        1,
        { email: 'x@y.com', role: InvitationRole.ADMIN },
        Object.assign(new User(), { id: 1 }),
      ),
    ).rejects.toMatchObject({ status: 429 });
  });
});
