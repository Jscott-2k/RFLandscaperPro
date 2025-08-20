import dataSource from '../data-source';
import { User, UserRole } from './users/user.entity';
import { Customer } from './customers/entities/customer.entity';

async function seed() {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const customerRepo = dataSource.getRepository(Customer);

  const adminExists = await userRepo.findOne({ where: { username: 'admin' } });
  if (!adminExists) {
    const admin = userRepo.create({
      username: 'admin',
      password: 'adminpass',
      role: UserRole.Admin,
    });
    await userRepo.save(admin);
  }

  const customerExists = await customerRepo.findOne({
    where: { email: 'customer@example.com' },
  });
  if (!customerExists) {
    const customer = customerRepo.create({
      name: 'John Doe',
      email: 'customer@example.com',
      phone: '555-1234',
      addresses: [
        {
          street: '123 Main St',
          city: 'Townsville',
          state: 'CA',
          zip: '12345',
        },
      ],
    });
    await customerRepo.save(customer);
  }

  await dataSource.destroy();
}

seed()
  .then(() => {
    console.log('Database seeded');
  })
  .catch((err) => {
    console.error('Seeding failed', err);
    process.exit(1);
  });
