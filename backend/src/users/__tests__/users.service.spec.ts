import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';

import { UsersService } from '../users.service';
import { User, UserRole } from '../user.entity';
import { EmailService } from '../../common/email.service';

const UNIQUE_VIOLATION = '23505';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<
    Pick<Repository<User>, 'create' | 'save' | 'findOne'>
  >;
  let emailService: EmailService;
  let sendPasswordResetEmailMock: jest.SpyInstance<
    Promise<void>,
    [string, string]
  >;

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
        return user;
      }),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<Repository<User>, 'create' | 'save' | 'findOne'>
    >;
    emailService = new EmailService();
    sendPasswordResetEmailMock = jest
      .spyOn(emailService, 'sendPasswordResetEmail')
      .mockResolvedValue();
    jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue();
    jest
      .spyOn(emailService, 'sendJobAssignmentNotification')
      .mockResolvedValue();
    service = new UsersService(
      usersRepository as unknown as Repository<User>,
      emailService,
    );
  });

  it('hashes passwords before saving', async () => {
    const password = 'plainpassword';
    const user = await service.create({ username: 'user1', password });
    expect(usersRepository.create).toHaveBeenCalledWith({
      username: 'user1',
      password,
    });
    expect(user.password).not.toBe(password);
    const isMatch = await bcrypt.compare(password, user.password);
    expect(isMatch).toBe(true);
  });

  it('assigns default role when none provided', async () => {
    const user = await service.create({
      username: 'user2',
      password: 'secret',
    });
    expect(user.role).toBe(UserRole.Customer);
  });

  it('throws conflict when username exists', async () => {
    const error = new QueryFailedError(
      '',
      [],
      Object.assign(new Error(), { code: UNIQUE_VIOLATION }),
    );
    usersRepository.save.mockRejectedValueOnce(error);

    await expect(
      service.create({ username: 'existing', password: 'secret' }),
    ).rejects.toMatchObject({
      message: 'Username already exists',
      status: 409,
    });
  });

  it('generates reset token and emails user', async () => {
    const user = Object.assign(new User(), { username: 'user3' });
    usersRepository.findOne.mockResolvedValueOnce(user);

    await service.requestPasswordReset('user3');
    const [[emailUsername, rawToken]] =
      sendPasswordResetEmailMock.mock.calls as [string, string][];
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    expect(emailUsername).toBe('user3');
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
});
