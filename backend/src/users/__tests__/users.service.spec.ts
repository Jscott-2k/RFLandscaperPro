import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';

import { UsersService } from '../users.service';
import { User, UserRole } from '../user.entity';
import { EmailService } from '../../common/email.service';
import { UserCreationService } from '../user-creation.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<
    Pick<Repository<User>, 'create' | 'save' | 'findOne' | 'find' | 'remove'>
  >;
  let userCreationService: jest.Mocked<Pick<UserCreationService, 'createUser'>>;
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
    userCreationService = {
      createUser: jest.fn(),
    } as jest.Mocked<Pick<UserCreationService, 'createUser'>>;
    emailService = {
      sendPasswordResetEmail: jest.fn<void, [string, string]>(),
    };
    service = new UsersService(
      usersRepository as unknown as Repository<User>,
      emailService as unknown as EmailService,
      userCreationService as unknown as UserCreationService,
    );
  });

  it('delegates user creation to UserCreationService', async () => {
    const dto = {
      username: 'user1',
      email: 'user1@example.com',
      password: 'secret',
    };
    const created = Object.assign(new User(), dto);
    userCreationService.createUser.mockResolvedValueOnce(created);

    const result = await service.create(dto);

    expect(userCreationService.createUser).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
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
      username: 'user5',
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 1000 * 60),
    });
    usersRepository.findOne.mockResolvedValueOnce(user);

    await expect(service.resetPassword(rawToken, 'weak')).rejects.toMatchObject({
      message: 'Password must be at least 8 characters long',
      status: 400,
    });
    expect(usersRepository.save).not.toHaveBeenCalled();
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
