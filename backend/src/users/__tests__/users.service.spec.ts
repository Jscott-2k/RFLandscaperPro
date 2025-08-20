import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';

import { UsersService } from '../users.service';
import { UserRole } from '../user.entity';

const UNIQUE_VIOLATION = '23505';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(() => {
    usersRepository = {
      create: jest.fn((dto) => ({ ...dto, role: dto.role ?? UserRole.Customer })),
      save: jest.fn((user) => Promise.resolve(user)),
      findOne: jest.fn(),
    };
    service = new UsersService(usersRepository as any);
  });

  it('hashes passwords before saving', async () => {
    const password = 'plainpassword';
    const user = await service.create({ username: 'user1', password });
    expect(user.password).not.toBe(password);
    const isMatch = await bcrypt.compare(password, user.password);
    expect(isMatch).toBe(true);
  });

  it('assigns default role when none provided', async () => {
    const user = await service.create({ username: 'user2', password: 'secret' });
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
    ).rejects.toMatchObject({ message: 'Username already exists', status: 409 });
  });
});
