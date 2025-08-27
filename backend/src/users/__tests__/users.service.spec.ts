import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';

import { UsersService } from '../users.service';
import { User, UserRole } from '../user.entity';
import { Company } from '../../companies/entities/company.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { EmailService } from '../../common/email.service';

const UNIQUE_VIOLATION = '23505';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<
    Pick<Repository<User>, 'create' | 'save' | 'findOne' | 'find' | 'remove'>
  >;
  let customerRepository: jest.Mocked<
    Pick<Repository<Customer>, 'create' | 'save'>
  >;
  let companyRepository: jest.Mocked<
    Pick<Repository<Company>, 'create' | 'save'>
  >;
  let emailService: {
    sendPasswordResetEmail: jest.Mock<void, [string, string]>;
  };

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
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<Repository<User>, 'create' | 'save' | 'findOne' | 'find' | 'remove'>
    >;
    customerRepository = {
      create: jest.fn((dto) => Object.assign(new Customer(), dto) as Customer),
      save: jest.fn(async (customer: Customer) => customer),
    } as unknown as jest.Mocked<Pick<Repository<Customer>, 'create' | 'save'>>;
    companyRepository = {
      create: jest.fn((dto) => Object.assign(new Company(), dto) as Company),
      save: jest.fn(async (company: Company) => {
        if (!company.id) {
          company.id = 1;
        }
        return company;
      }),
    } as unknown as jest.Mocked<Pick<Repository<Company>, 'create' | 'save'>>;
    emailService = {
      sendPasswordResetEmail: jest.fn<void, [string, string]>(),
    };
    service = new UsersService(
      usersRepository as unknown as Repository<User>,
      customerRepository as unknown as Repository<Customer>,
      companyRepository as unknown as Repository<Company>,
      emailService as unknown as EmailService,
    );
  });

  it('hashes passwords before saving', async () => {
    const password = 'plainpassword';
    const user = await service.create({
      username: 'user1',
      email: 'user1@example.com',
      password,
    });
    expect(usersRepository.create).toHaveBeenCalledWith({
      username: 'user1',
      email: 'user1@example.com',
      password,
    });
    expect(user.password).not.toBe(password);
    const isMatch = await bcrypt.compare(password, user.password);
    expect(isMatch).toBe(true);
  });

  it('assigns default role when none provided', async () => {
    const user = await service.create({
      username: 'user2',
      email: 'user2@example.com',
      password: 'secret',
    });
    expect(user.role).toBe(UserRole.Customer);
    expect(customerRepository.create).toHaveBeenCalledWith({
      name: 'user2',
      email: 'user2@example.com',
      userId: 1,
    });
    expect(customerRepository.save).toHaveBeenCalled();
  });

  it('creates company for owner accounts', async () => {
    const user = await service.create({
      username: 'owner',
      email: 'owner@example.com',
      password: 'secret',
      role: UserRole.Owner,
      companyName: 'ACME Landscaping',
    });
    expect(companyRepository.create).toHaveBeenCalledWith({
      name: 'ACME Landscaping',
      ownerId: 1,
    });
    expect(companyRepository.save).toHaveBeenCalled();
    expect(usersRepository.save).toHaveBeenCalledTimes(2);
    expect(user.companyId).toBe(1);
  });

  it('requires companyId for worker accounts', async () => {
    await expect(
      service.create({
        username: 'worker',
        email: 'w@example.com',
        password: 'secret',
        role: UserRole.Worker,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws conflict when username exists', async () => {
    const error = new QueryFailedError(
      '',
      [],
      Object.assign(new Error(), { code: UNIQUE_VIOLATION }),
    );
    usersRepository.save.mockRejectedValueOnce(error);

    await expect(
      service.create({
        username: 'existing',
        email: 'existing@example.com',
        password: 'secret',
      }),
    ).rejects.toMatchObject({
      message: 'Username or email already exists',
      status: 409,
    });
  });

  it('generates reset token and emails user', async () => {
    const user = Object.assign(new User(), {
      username: 'user3',
      email: 'user3@example.com',
    });
    usersRepository.findOne.mockResolvedValueOnce(user);

    await service.requestPasswordReset('user3@example.com');
    const [[emailAddress, rawToken]] =
      emailService.sendPasswordResetEmail.mock.calls;
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    expect(emailAddress).toBe('user3@example.com');
    expect(user.passwordResetToken).toBe(hashedToken);
    expect(user.passwordResetExpires).toBeInstanceOf(Date);
    expect(usersRepository.save).toHaveBeenCalledWith(user);
  });

  it('resets password with valid token', async () => {
    const rawToken = 'token123';
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const user = Object.assign(new User(), {
      username: 'user4',
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 1000 * 60),
    });
    usersRepository.findOne.mockResolvedValueOnce(user);

    await service.resetPassword(rawToken, 'newpass');

    expect(user.passwordResetToken).toBeNull();
    expect(user.passwordResetExpires).toBeNull();
    expect(usersRepository.save).toHaveBeenCalledWith(user);
    const isMatch = await bcrypt.compare('newpass', user.password);
    expect(isMatch).toBe(true);
  });

  it('updates profile and hashes new password', async () => {
    const user = Object.assign(new User(), {
      id: 1,
      username: 'old',
      email: 'old@example.com',
      password: 'oldpass',
    });
    usersRepository.findOne.mockResolvedValue(user);

    const updated = await service.updateProfile(1, {
      username: 'new',
      email: 'new@example.com',
      password: 'Newpass1!',
    });

    expect(updated.username).toBe('new');
    expect(updated.email).toBe('new@example.com');
    const isMatch = await bcrypt.compare('Newpass1!', updated.password);
    expect(isMatch).toBe(true);
    expect(usersRepository.save).toHaveBeenCalledWith(user);
  });

  it('finds all users', async () => {
    const users = [
      Object.assign(new User(), { id: 1, username: 'u1' }),
      Object.assign(new User(), { id: 2, username: 'u2' }),
    ];
    usersRepository.find.mockResolvedValue(users);
    const result = await service.findAll();
    expect(result).toBe(users);
    expect(usersRepository.find).toHaveBeenCalled();
  });

  it('updates user by id', async () => {
    const user = Object.assign(new User(), { id: 1, username: 'old' });
    usersRepository.findOne.mockResolvedValue(user);
    const updated = await service.update(1, { username: 'new' });
    expect(updated.username).toBe('new');
    expect(usersRepository.save).toHaveBeenCalledWith(user);
  });

  it('removes user by id', async () => {
    const user = Object.assign(new User(), { id: 1 });
    usersRepository.findOne.mockResolvedValue(user);
    await service.remove(1);
    expect(usersRepository.remove).toHaveBeenCalledWith(user);
  });

  it('updates user role', async () => {
    const user = Object.assign(new User(), { id: 1, role: UserRole.Customer });
    usersRepository.findOne.mockResolvedValue(user);
    const updated = await service.updateRole(1, UserRole.Admin);
    expect(updated.role).toBe(UserRole.Admin);
    expect(usersRepository.save).toHaveBeenCalledWith(user);
  });
});
