import { MeController } from './me.controller';
import { Repository } from 'typeorm';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../companies/entities/company-user.entity';
import { User } from './user.entity';

describe('MeController', () => {
  let controller: MeController;
  let repo: jest.Mocked<Pick<Repository<CompanyUser>, 'find'>>;

  beforeEach(() => {
    repo = { find: jest.fn() } as unknown as jest.Mocked<
      Pick<Repository<CompanyUser>, 'find'>
    >;
    controller = new MeController(repo as unknown as Repository<CompanyUser>);
  });

  it('returns active memberships', async () => {
    repo.find.mockResolvedValue([
      Object.assign(new CompanyUser(), {
        companyId: 1,
        role: CompanyUserRole.ADMIN,
        status: CompanyUserStatus.ACTIVE,
        company: { name: 'Acme' },
      }),
    ]);

    const user = Object.assign(new User(), { id: 1 });
    const result = await controller.listCompanies(user);

    expect(repo.find).toHaveBeenCalledWith({
      where: { userId: 1, status: CompanyUserStatus.ACTIVE },
      relations: ['company'],
    });
    expect(result).toEqual([
      { companyId: 1, companyName: 'Acme', role: CompanyUserRole.ADMIN },
    ]);
  });
});
