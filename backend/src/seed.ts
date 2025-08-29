// seed.ts
import 'dotenv/config';
import dataSource from '../data-source';
import { DataSource } from 'typeorm';
import { User, UserRole } from './users/user.entity';
import { Customer } from './customers/entities/customer.entity';
import { Company } from './companies/entities/company.entity';
import {
  CompanyUser,
  CompanyUserRole,
} from './companies/entities/company-user.entity';
import {
  Contract,
  ContractFrequency,
} from './contracts/entities/contract.entity';
import { Job } from './jobs/entities/job.entity';
import { Email } from './users/value-objects/email.vo';
import { PhoneNumber } from './users/value-objects/phone-number.vo';
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
      console.log(
        'Dropping and rebuilding database schema through migrations...',
      );
      await ds.dropDatabase();
      if (!ds.isInitialized) {
        await ds.initialize();
      }
      await ds.runMigrations();
      console.log('Database dropped and migrations run.');
    }

    await ds.transaction(async (trx) => {
      const userRepo = trx.getRepository(User);
      const customerRepo = trx.getRepository(Customer);
      const companyRepo = trx.getRepository(Company);
      const contractRepo = trx.getRepository(Contract);
      const jobRepo = trx.getRepository(Job);
      const companyUserRepo = trx.getRepository(CompanyUser);

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
          email: new Email(adminEmail),
          password: hashed,
          role: UserRole.Admin,
          firstName: 'Admin',
          lastName: 'User',
          phone: new PhoneNumber('555-000-0000'),
        },
        {
          conflictPaths: ['username'],
          skipUpdateIfNoValuesChanged: true,
        },
      );
      const adminUser = await userRepo.findOneOrFail({
        where: { username: adminUsername },
      });

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
        { name: companyName, ownerId: adminUser.id },
        {
          conflictPaths: ['name'],
          skipUpdateIfNoValuesChanged: true,
        },
      );
      const company = await companyRepo.findOneOrFail({
        where: { name: companyName },
      });
      console.log('Sample company ensured.');

      await companyUserRepo.upsert(
        {
          companyId: company.id,
          userId: adminUser.id,
          role: CompanyUserRole.OWNER,
        },
        {
          conflictPaths: ['companyId', 'userId'],
          skipUpdateIfNoValuesChanged: true,
        },
      );

      // --- Sample customer ---
      const customerEmail = 'customer@example.com';
      await customerRepo.upsert(
        {
          name: 'John Doe',
          email: customerEmail,
          phone: '555-1234',
          companyId: company.id,
          addresses: [
            {
              street: '123 Main St',
              city: 'Townsville',
              state: 'CA',
              zip: '12345',
              companyId: company.id,
            },
          ],
        },
        {
          conflictPaths: ['email', 'companyId'],
          skipUpdateIfNoValuesChanged: true,
        },
      );
      const customer = await customerRepo.findOneOrFail({
        where: { email: customerEmail, companyId: company.id },
      });
      console.log('Sample customer ensured.');

      // --- Sample contract ---
      const contractStart = new Date('2024-01-01');
      let contract = await contractRepo.findOne({
        where: {
          companyId: company.id,
          customer: { id: customer.id },
          startDate: contractStart,
        },
        relations: ['customer'],
      });
      if (!contract) {
        contract = contractRepo.create({
          companyId: company.id,
          customer,
          startDate: contractStart,
          frequency: ContractFrequency.MONTHLY,
          jobTemplate: {
            title: 'Monthly Lawn Care',
            description: 'Recurring maintenance service',
            estimatedHours: 2,
            notes: 'Includes mowing and trimming',
          },
          active: true,
        });
        contract = await contractRepo.save(contract);
      }
      console.log('Sample contract ensured.');

      // --- Sample job ---
      const existingJob = await jobRepo.findOne({
        where: {
          title: 'Initial Lawn Care Visit',
          customer: { id: customer.id },
        },
      });
      if (!existingJob) {
        await jobRepo.save({
          title: 'Initial Lawn Care Visit',
          description: 'Kick-off job for the sample contract',
          scheduledDate: new Date(),
          companyId: company.id,
          customer,
          contract,
        });
      }
      console.log('Sample job ensured.');
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
