import { MeController } from './me.controller';
import { Repository } from 'typeorm';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../companies/entities/company-user.entity';
import { Company } from '../companies/entities/company.entity';
import { User, UserRole } from './user.entity';

describe('MeController', () => {
  let controller: MeController;
  let companyUserRepo: jest.Mocked<Pick<Repository<CompanyUser>, 'find'>>;
  let companyRepo: jest.Mocked<Pick<Repository<Company>, 'find'>>;

  beforeEach(() => {
    companyUserRepo = { find: jest.fn() } as unknown as jest.Mocked<
      Pick<Repository<CompanyUser>, 'find'>
    >;
    companyRepo = { find: jest.fn() } as unknown as jest.Mocked<
      Pick<Repository<Company>, 'find'>
    >;
    controller = new MeController(
      companyUserRepo as unknown as Repository<CompanyUser>,
      companyRepo as unknown as Repository<Company>,
    );
  });

  it('returns active memberships', async () => {
    companyUserRepo.find.mockResolvedValue([
      Object.assign(new CompanyUser(), {
        companyId: 1,
        role: CompanyUserRole.ADMIN,
        status: CompanyUserStatus.ACTIVE,
        company: { name: 'Acme' },
      }),
    ]);

    const user = Object.assign(new User(), { id: 1 });
    const result = await controller.listCompanies(user);

    expect(companyUserRepo.find).toHaveBeenCalledWith({
      where: { userId: 1, status: CompanyUserStatus.ACTIVE },
      relations: ['company'],
    });
    expect(result).toEqual([
      { companyId: 1, companyName: 'Acme', role: CompanyUserRole.ADMIN },
    ]);
  });

  it('returns all companies for master user', async () => {
    companyRepo.find.mockResolvedValue([
      Object.assign(new Company(), { id: 1, name: 'Acme' }),
    ]);

    const user = Object.assign(new User(), { id: 1, role: UserRole.Master });
    const result = await controller.listCompanies(user);

    expect(companyRepo.find).toHaveBeenCalled();
    expect(result).toEqual([
      { companyId: 1, companyName: 'Acme', role: CompanyUserRole.ADMIN },
    ]);
  });
});
