import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { type EntityManager, QueryFailedError, type Repository } from 'typeorm';

import { type CreateCompanyDto } from '../../companies/dto/create-company.dto';
import { type Company } from '../../companies/entities/company.entity';
import { type CompanyOnboardingService } from '../company-onboarding.service';
import { type CustomerRegistrationService } from '../customer-registration.service';
import { UserCreationService } from '../user-creation.service';
import { User, UserRole } from '../user.entity';
import { Email } from '../value-objects/email.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';

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
    } as unknown as Repository<User> & { manager: EntityManager };

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
      company: {
        address: '123 Street',
        email: 'company@example.com',
        name: 'Acme Co',
        phone: '1234567890',
      },
      email: new Email('user1@example.com'),
      firstName: 'First',
      isVerified: false,
      lastName: 'Last',
      password,
      phone: new PhoneNumber('1234567890'),
      role: UserRole.Customer,
      username: 'user1',
    });
    const createMock = jest.spyOn(usersRepository, 'create');
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: expect.any(Email) as unknown as Email,
        firstName: 'First',
        isVerified: false,
        lastName: 'Last',
        password,
        role: UserRole.Customer,
        username: 'user1',
      }),
    );
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
      company: {
        address: '123 Street',
        email: 'acme@example.com',
        name: 'ACME Landscaping',
        phone: '1234567890',
      },
      email: new Email('owner@example.com'),
      firstName: 'First',
      isVerified: false,
      lastName: 'Owner',
      password: 'secret',
      phone: new PhoneNumber('1234567890'),
      role: UserRole.CompanyOwner,
      username: 'owner',
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
        company: {
          address: '123 Street',
          email: 'company@example.com',
          name: 'Acme Co',
          phone: '1234567890',
        },
        email: new Email('w@example.com'),
        firstName: 'First',
        isVerified: false,
        lastName: 'Worker',
        password: 'secret',
        phone: new PhoneNumber('1234567890'),
        role: UserRole.Worker,
        username: 'worker',
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
        company: {
          address: '123 Street',
          email: 'company@example.com',
          name: 'Acme Co',
          phone: '1234567890',
        },
        email: new Email('existing@example.com'),
        firstName: 'First',
        isVerified: false,
        lastName: 'Last',
        password: 'secret',
        phone: new PhoneNumber('1234567890'),
        role: UserRole.Customer,
        username: 'existing',
      }),
    ).rejects.toMatchObject({
      message: 'Username or email already exists',
      status: 409,
    });
  });
});
