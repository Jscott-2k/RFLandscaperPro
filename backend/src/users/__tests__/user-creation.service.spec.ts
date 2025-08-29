import * as bcrypt from 'bcrypt';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { UserCreationService } from '../user-creation.service';
import { User, UserRole } from '../user.entity';
import { Email } from '../value-objects/email.vo';
import { CustomerRegistrationService } from '../customer-registration.service';
import { CompanyOnboardingService } from '../company-onboarding.service';
import { CreateCompanyDto } from '../../companies/dto/create-company.dto';
import { Company } from '../../companies/entities/company.entity';
import { BadRequestException } from '@nestjs/common';

const UNIQUE_VIOLATION = '23505';

describe('UserCreationService', () => {
  let service: UserCreationService;
    let usersRepository: Repository<User> & { manager: EntityManager };
  let customerRegistrationService: jest.Mocked<
    Pick<CustomerRegistrationService, 'register'>
  >;
  let companyOnboardingService: jest.Mocked<
    Pick<CompanyOnboardingService, 'onboard'>
  >;
  let manager: EntityManager;

  beforeEach(() => {
    usersRepository = {
      create: jest.fn(
        (dto) =>
          Object.assign(new User(), {
            role: UserRole.Customer,
            ...dto,
          }) as User,
      ),
      save: jest.fn(async (user: User) => {
        if (user.password) {
          await user.hashPassword();
        }
        if (!user.id) {
          user.id = 1;
        }
        return user;
      }),
    } as unknown as Repository<User> & { manager: any };

      manager = {
        getRepository: jest.fn(() => usersRepository),
        transaction: jest.fn(
          async (cb: (em: EntityManager) => Promise<unknown>) => cb(manager),
        ),
      } as unknown as EntityManager;

      usersRepository.manager = manager as unknown as EntityManager;

    customerRegistrationService = {
      register: jest.fn(),
    } as jest.Mocked<Pick<CustomerRegistrationService, 'register'>>;

    companyOnboardingService = {
      onboard: jest.fn(),
    } as jest.Mocked<Pick<CompanyOnboardingService, 'onboard'>>;

    service = new UserCreationService(
      usersRepository as Repository<User>,
      customerRegistrationService as unknown as CustomerRegistrationService,
      companyOnboardingService as unknown as CompanyOnboardingService,
    );
  });

  it('hashes passwords and registers customer by default', async () => {
    const password = 'plainpassword';
    const user = await service.createUser({
      username: 'user1',
      email: new Email('user1@example.com'),
      password,
    });
    const createMock = jest.spyOn(usersRepository, 'create');
    expect(createMock).toHaveBeenCalledWith({
      username: 'user1',
      email: expect.any(Email) as unknown as Email,
      password,
    });
    expect(customerRegistrationService.register).toHaveBeenCalled();
    expect(user.role).toBe(UserRole.Customer);
    const isMatch = await bcrypt.compare(password, user.password);
    expect(isMatch).toBe(true);
  });

  it('onboards company for owner accounts', async () => {
    companyOnboardingService.onboard.mockImplementation(
      async (
        user: User,
        _company?: CreateCompanyDto,
        _manager?: EntityManager,
      ): Promise<Company> => {
        user.companyId = 1;
        void _company;
        void _manager;
        await Promise.resolve();
        return {} as Company;
      },
    );
    const user = await service.createUser({
      username: 'owner',
      email: new Email('owner@example.com'),
      password: 'secret',
      role: UserRole.CompanyOwner,
      company: { name: 'ACME Landscaping' },
    });

    expect(companyOnboardingService.onboard).toHaveBeenCalled();
    expect(user.companyId).toBe(1);
  });

  it('requires company for worker accounts', async () => {
    companyOnboardingService.onboard.mockRejectedValueOnce(
      new BadRequestException(),
    );
    await expect(
      service.createUser({
        username: 'worker',
        email: new Email('w@example.com'),
        password: 'secret',
        role: UserRole.Worker,
      }),
    ).rejects.toMatchObject({ status: 400 });

    expect(companyOnboardingService.onboard).toHaveBeenCalled();
  });

  it('throws conflict when username exists', async () => {
    const error = new QueryFailedError(
      '',
      [],
      Object.assign(new Error(), { code: UNIQUE_VIOLATION }),
    );
    (usersRepository.save as jest.Mock).mockRejectedValueOnce(error);

    await expect(
      service.createUser({
        username: 'existing',
        email: new Email('existing@example.com'),
        password: 'secret',
      }),
    ).rejects.toMatchObject({
      message: 'Username or email already exists',
      status: 409,
    });
  });
});
