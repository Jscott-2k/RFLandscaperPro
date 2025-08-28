// seed.ts
import 'dotenv/config';
import dataSource from '../data-source';
import { DataSource } from 'typeorm';
import { User, UserRole } from './users/user.entity';
import { Customer } from './customers/entities/customer.entity';
import { Company } from './companies/entities/company.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding is disabled in production');
  }

  const drop = process.argv.includes('--drop');

  const ds: DataSource = await dataSource.initialize();
  console.log('Database connection established');

  try {
    if (drop) {
      console.log('Dropping and re-syncing database schema...');
      await ds.dropDatabase();
      await ds.synchronize();
      console.log('Database dropped and schema synchronized.');
    }

    await ds.transaction(async (trx) => {
      const userRepo = trx.getRepository(User);
      const customerRepo = trx.getRepository(Customer);
      const companyRepo = trx.getRepository(Company);

      // --- Admin user ---
      const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
      const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';

      const rawAdminPassword =
        process.env.ADMIN_PASSWORD ??
        crypto.randomBytes(16).toString('base64url');

      const hashed = await bcrypt.hash(rawAdminPassword, 12);

      await userRepo.upsert(
        {
          username: adminUsername,
          email: adminEmail,
          password: hashed,
          role: UserRole.Admin,
          firstName: 'Admin',
          lastName: 'User',
          phone: '555-0000',
        },
        {
          conflictPaths: ['username'],
          skipUpdateIfNoValuesChanged: true,
        },
      );

      if (!process.env.ADMIN_PASSWORD) {
        console.log(
          `Admin user ensured. Generated password: ${rawAdminPassword}`,
        );
      } else {
        console.log('Admin user ensured (password from environment variable).');
      }

      // --- Sample company ---
      const companyName = 'Sample Company';
      await companyRepo.upsert(
        { name: companyName },
        {
          conflictPaths: ['name'],
          skipUpdateIfNoValuesChanged: true,
        },
      );
      const company = await companyRepo.findOneOrFail({
        where: { name: companyName },
      });
      console.log('Sample company ensured.');

      // --- Sample customer ---
      await customerRepo.upsert(
        {
          name: 'John Doe',
          email: 'customer@example.com',
          phone: '555-1234',
          companyId: company.id,
          addresses: [
            {
              street: '123 Main St',
              city: 'Townsville',
              state: 'CA',
              zip: '12345',
            },
          ],
        },
        {
          conflictPaths: ['email'],
          skipUpdateIfNoValuesChanged: true,
        },
      );

      console.log('Sample customer ensured.');
    });

    console.log('Database seeding completed successfully');
  } finally {
    await ds.destroy();
    console.log('Database connection closed');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
