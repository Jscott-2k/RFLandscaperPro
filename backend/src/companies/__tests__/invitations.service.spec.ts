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
import { Email } from '../../users/value-objects/email.vo';
import { EmailService } from '../../common/email';
import { SendMailOptions } from 'nodemailer';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let invitationsRepo: jest.Mocked<
    Pick<Repository<Invitation>, 'create' | 'save' | 'findOne' | 'count'>
  >;
  let companyUsersRepo: jest.Mocked<Pick<Repository<CompanyUser>, 'findOne'>>;
  let usersRepo: jest.Mocked<Pick<Repository<User>, 'findOne'>>;
  let companiesRepo: jest.Mocked<Pick<Repository<Company>, 'findOne'>>;
  let emailService: { send: jest.Mock<void, [SendMailOptions]> };

  beforeEach(() => {
    invitationsRepo = {
      create: jest.fn((dto: Partial<Invitation>) =>
        Object.assign(new Invitation(), dto),
      ),
      save: jest.fn((inv: Invitation) => {
        inv.id = inv.id ?? 1;
        return Promise.resolve(inv);
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
      findOne: jest.fn(() =>
        Promise.resolve(Object.assign(new Company(), { id: 5, name: 'Co' })),
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

  it('creates invitation, hashes token and sends email', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    invitationsRepo.findOne.mockResolvedValue(null);
    invitationsRepo.count.mockResolvedValue(0);

    const inviter = Object.assign(new User(), { id: 1 });
    const dto = { email: 'worker@example.com', role: InvitationRole.WORKER };

    const invitation = await service.createInvitation(5, dto, inviter);

    const [[options]] = emailService.send.mock.calls;
    const tokenMatch = (options.html as string).match(/token=([\w]+)/);
    const rawToken = tokenMatch ? tokenMatch[1] : '';
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

    expect(options.to).toBe('worker@example.com');
    expect(options.subject).toBe('Company Invitation');
    expect(invitation.tokenHash).toBe(hashed);
    expect(invitation.expiresAt).toBeInstanceOf(Date);
    expect(options.html as string).toContain('Co');
    expect(options.html as string).toContain('Worker');
  });

  it('rejects inviting existing active member', async () => {
    const existingUser = Object.assign(new User(), {
      id: 10,
      email: new Email('a@b.com'),
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
