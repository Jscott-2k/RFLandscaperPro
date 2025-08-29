import { Repository } from 'typeorm';
import { MembersService } from '../members.service';
import { Email } from '../../users/value-objects/email.vo';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../entities/company-user.entity';
import { UpdateCompanyMemberDto } from '../dto/update-company-member.dto';

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
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
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
      userId: 2,
      role: CompanyUserRole.WORKER,
      status: CompanyUserStatus.ACTIVE,
      user: { id: 2, username: 'u', email: new Email('u@e.com') },
    });
    repo.findOne.mockResolvedValue(membership);
    repo.save.mockImplementation(async (m) => m as CompanyUser);

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
      userId: 1,
      role: CompanyUserRole.OWNER,
      status: CompanyUserStatus.ACTIVE,
      user: { id: 1, username: 'o', email: new Email('o@e.com') },
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
      userId: 1,
      role: CompanyUserRole.OWNER,
      status: CompanyUserStatus.ACTIVE,
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
      userId: 2,
      role: CompanyUserRole.ADMIN,
      status: CompanyUserStatus.ACTIVE,
    });
    repo.findOne.mockResolvedValue(membership);

    await service.removeMember(1, 2);
    expect(repo.delete).toHaveBeenCalledWith({ companyId: 1, userId: 2 });
  });
});
