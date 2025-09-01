import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { type SendMailOptions } from 'nodemailer';
import { type Repository } from 'typeorm';

import { type EmailService } from '../../common/email';
import { type UserCreationService } from '../user-creation.service';
import { User, UserRole } from '../user.entity';
import { UsersService } from '../users.service';
import { Email } from '../value-objects/email.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<
    Pick<Repository<User>, 'create' | 'save' | 'findOne' | 'find' | 'remove'>
  >;
  let userCreationService: jest.Mocked<Pick<UserCreationService, 'createUser'>>;
  let emailService: { send: jest.Mock<void, [SendMailOptions]> };

  beforeEach(() => {
    usersRepository = {
      create: jest.fn(
        (dto) =>
          Object.assign(new User(), {
            role: UserRole.Customer,
            ...dto,
          }) as User,
      ),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(async (user: User) => {
        if (user.password) {
          await user.hashPassword();
        }
        if (!user.id) {
          user.id = 1;
        }
        return user;
      }),
    } as unknown as jest.Mocked<
      Pick<Repository<User>, 'create' | 'save' | 'findOne' | 'find' | 'remove'>
    >;
    userCreationService = {
      createUser: jest.fn(),
    } as jest.Mocked<Pick<UserCreationService, 'createUser'>>;
    emailService = {
      send: jest.fn<void, [SendMailOptions]>(),
    };
    service = new UsersService(
      usersRepository as unknown as Repository<User>,
      emailService as unknown as EmailService,
      userCreationService as unknown as UserCreationService,
    );
  });

  it('delegates user creation to UserCreationService', async () => {
    const dto = {
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
      password: 'secret',
      phone: new PhoneNumber('1234567890'),
      role: UserRole.Customer,
      username: 'user1',
    };
    const created = Object.assign(new User(), dto);
    userCreationService.createUser.mockResolvedValueOnce(created);

    const result = await service.create(dto);

    expect(userCreationService.createUser).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('generates reset token and emails user', async () => {
    const user = Object.assign(new User(), {
      email: new Email('user3@example.com'),
      username: 'user3',
    });
    usersRepository.findOne.mockResolvedValueOnce(user);

    await service.requestPasswordReset('user3@example.com');
    const [[options]] = emailService.send.mock.calls;
    const text = options.text as string;
    const match = text.match(/token is: (.*)$/);
    const rawToken = match ? match[1] : '';
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    expect(options.to).toBe('user3@example.com');
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
      passwordResetExpires: new Date(Date.now() + 1000 * 60),
      passwordResetToken: hashedToken,
      username: 'user4',
    });
    usersRepository.findOne.mockResolvedValueOnce(user);

    await service.resetPassword(rawToken, 'Newpass1!');

    expect(user.passwordResetToken).toBeNull();
    expect(user.passwordResetExpires).toBeNull();
    expect(usersRepository.save).toHaveBeenCalledWith(user);
    const isMatch = await bcrypt.compare('Newpass1!', user.password);
    expect(isMatch).toBe(true);
  });

  it('rejects weak passwords when resetting password', async () => {
    const rawToken = 'token456';
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const user = Object.assign(new User(), {
      passwordResetExpires: new Date(Date.now() + 1000 * 60),
      passwordResetToken: hashedToken,
      username: 'user5',
    });
    usersRepository.findOne.mockResolvedValueOnce(user);

    await expect(service.resetPassword(rawToken, 'weak')).rejects.toMatchObject(
      {
        message: 'Password must be at least 8 characters long',
        status: 400,
      },
    );
    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('updates profile and hashes new password', async () => {
    const user = Object.assign(new User(), {
      email: new Email('old@example.com'),
      id: 1,
      password: 'oldpass',
      username: 'old',
    });
    usersRepository.findOne.mockResolvedValue(user);

    const updated = await service.updateProfile(1, {
      email: new Email('new@example.com'),
      password: 'Newpass1!',
      username: 'new',
    });

    expect(updated.username).toBe('new');
    expect(updated.email.value).toBe('new@example.com');
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
    const updated = await service.updateRole(1, UserRole.CompanyAdmin);
    expect(updated.role).toBe(UserRole.CompanyAdmin);
    expect(usersRepository.save).toHaveBeenCalledWith(user);
  });
});
