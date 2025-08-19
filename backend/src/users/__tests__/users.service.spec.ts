import * as bcrypt from 'bcrypt';
import { UsersService } from '../users.service';
import { UserRole } from '../user.entity';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    const usersRepository = {
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
});
