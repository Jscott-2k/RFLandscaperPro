import { type Repository } from 'typeorm';

import { Email } from '../../users/value-objects/email.vo';
import { type UpdateCompanyMemberDto } from '../dto/update-company-member.dto';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../entities/company-user.entity';
import { MembersService } from '../members.service';

describe('MembersService', () => {
  let service: MembersService;
  let repo: jest.Mocked<
    Pick<
      Repository<CompanyUser>,
      'find' | 'findOne' | 'count' | 'save' | 'delete'
    >
  >;

  beforeEach(() => {
    repo = {
      count: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<
        Repository<CompanyUser>,
        'find' | 'findOne' | 'count' | 'save' | 'delete'
      >
    >;
    service = new MembersService(repo as unknown as Repository<CompanyUser>);
  });

  it('updates role and status for a member', async () => {
    const membership = Object.assign(new CompanyUser(), {
      companyId: 1,
      role: CompanyUserRole.WORKER,
      status: CompanyUserStatus.ACTIVE,
      user: { email: new Email('u@e.com'), id: 2, username: 'u' },
      userId: 2,
    });
    repo.findOne.mockResolvedValue(membership);
    repo.save.mockImplementation((m) => Promise.resolve(m as CompanyUser));

    const dto: UpdateCompanyMemberDto = {
      role: CompanyUserRole.ADMIN,
      status: CompanyUserStatus.SUSPENDED,
    };
    const updated = await service.updateMember(1, 2, dto);
    expect(updated.role).toBe(CompanyUserRole.ADMIN);
    expect(updated.status).toBe(CompanyUserStatus.SUSPENDED);
  });

  it('prevents demoting the last owner', async () => {
    const membership = Object.assign(new CompanyUser(), {
      companyId: 1,
      role: CompanyUserRole.OWNER,
      status: CompanyUserStatus.ACTIVE,
      user: { email: new Email('o@e.com'), id: 1, username: 'o' },
      userId: 1,
    });
    repo.findOne.mockResolvedValue(membership);
    repo.count.mockResolvedValue(1);

    await expect(
      service.updateMember(1, 1, { role: CompanyUserRole.ADMIN }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('prevents removing the last owner', async () => {
    const membership = Object.assign(new CompanyUser(), {
      companyId: 1,
      role: CompanyUserRole.OWNER,
      status: CompanyUserStatus.ACTIVE,
      userId: 1,
    });
    repo.findOne.mockResolvedValue(membership);
    repo.count.mockResolvedValue(1);

    await expect(service.removeMember(1, 1)).rejects.toMatchObject({
      status: 400,
    });
  });

  it('removes a member', async () => {
    const membership = Object.assign(new CompanyUser(), {
      companyId: 1,
      role: CompanyUserRole.ADMIN,
      status: CompanyUserStatus.ACTIVE,
      userId: 2,
    });
    repo.findOne.mockResolvedValue(membership);

    await service.removeMember(1, 2);
    expect(repo.delete).toHaveBeenCalledWith({ companyId: 1, userId: 2 });
  });
});
