import dataSource from '../data-source';
import { User, UserRole } from './users/user.entity';
import { Customer } from './customers/entities/customer.entity';

async function seed() {
  let dataSourceInstance: any;

  try {
    dataSourceInstance = await dataSource.initialize();
    console.log('Database connection established');

    const userRepo = dataSourceInstance.getRepository(User);
    const customerRepo = dataSourceInstance.getRepository(Customer);

    // Create admin user with secure password
    const adminExists = await userRepo.findOne({
      where: { username: 'admin' },
    });
    if (!adminExists) {
      const admin = userRepo.create({
        username: 'admin',
        password: 'AdminSecure123!', // More secure password
        role: UserRole.Admin,
      });
      await userRepo.save(admin);
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    // Create sample customer
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
      console.log('Sample customer created successfully');
    } else {
      console.log('Sample customer already exists');
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    if (dataSourceInstance && dataSourceInstance.isInitialized) {
      await dataSourceInstance.destroy();
      console.log('Database connection closed');
    }
  }
}

seed()
  .then(() => {
    console.log('Database seeded successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
