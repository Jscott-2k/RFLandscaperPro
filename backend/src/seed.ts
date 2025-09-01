import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { type DataSource } from 'typeorm';
import winston from 'winston';

import {
  CompanyUser,
  CompanyUserRole,
} from './companies/entities/company-user.entity';
import { Company } from './companies/entities/company.entity';
import {
  Contract,
  ContractFrequency,
} from './contracts/entities/contract.entity';
import { Customer } from './customers/entities/customer.entity';
import dataSource from './data-source';
import { Job } from './jobs/entities/job.entity';
import { User, UserRole } from './users/user.entity';
import { Email } from './users/value-objects/email.vo';
import { PhoneNumber } from './users/value-objects/phone-number.vo';

// seed.ts
import 'dotenv/config';

const logger = winston.createLogger({
  format: winston.format.json(),
  level: 'info',
  transports: [new winston.transports.Console()],
});

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding is disabled in production');
  }

  const drop = process.argv.includes('--drop');

  const ds: DataSource = await dataSource.initialize();
  logger.info('Database connection established');

  try {
    if (drop) {
      logger.info(
        'Dropping and rebuilding database schema through migrations...',
      );
      await ds.dropDatabase();
      if (!ds.isInitialized) {
        await ds.initialize();
      }
      await ds.runMigrations();
      logger.info('Database dropped and migrations run.');
    }

    await ds.transaction(async (trx) => {
      const userRepo = trx.getRepository(User);
      const customerRepo = trx.getRepository(Customer);
      const companyRepo = trx.getRepository(Company);
      const contractRepo = trx.getRepository(Contract);
      const jobRepo = trx.getRepository(Job);
      const companyUserRepo = trx.getRepository(CompanyUser);

      // --- Master user ---
      const masterUsername = process.env.MASTER_USERNAME ?? 'master';
      const masterEmail = process.env.MASTER_EMAIL ?? 'master@example.com';

      const rawMasterPassword =
        process.env.MASTER_PASSWORD ??
        crypto.randomBytes(16).toString('base64url');

      const masterHashed = await bcrypt.hash(rawMasterPassword, 12);

      await userRepo.upsert(
        {
          email: new Email(masterEmail),
          firstName: 'Master',
          isVerified: true,
          lastName: 'User',
          password: masterHashed,
          phone: new PhoneNumber('555-000-0000'),
          role: UserRole.Master,
          username: masterUsername,
        },
        {
          conflictPaths: ['username'],
          skipUpdateIfNoValuesChanged: true,
        },
      );
      await userRepo.findOneOrFail({
        where: { username: masterUsername },
      });
      if (!process.env.MASTER_PASSWORD) {
        logger.info('Master user ensured. Generated password.', {
          password: rawMasterPassword,
        });
      } else {
        logger.info(
          'Master user ensured (password from environment variable).',
        );
      }

      // --- Company admin user ---
      const companyAdminUsername =
        process.env.COMPANY_ADMIN_USERNAME ?? 'admin';
      const companyAdminEmail =
        process.env.COMPANY_ADMIN_EMAIL ?? 'admin@example.com';

      const rawCompanyAdminPassword =
        process.env.COMPANY_ADMIN_PASSWORD ??
        crypto.randomBytes(16).toString('base64url');

      const hashed = await bcrypt.hash(rawCompanyAdminPassword, 12);

      await userRepo.upsert(
        {
          email: new Email(companyAdminEmail),
          firstName: 'Admin',
          isVerified: true,
          lastName: 'User',
          password: hashed,
          phone: new PhoneNumber('555-000-0000'),
          role: UserRole.CompanyAdmin,
          username: companyAdminUsername,
        },
        {
          conflictPaths: ['username'],
          skipUpdateIfNoValuesChanged: true,
        },
      );
      const adminUser = await userRepo.findOneOrFail({
        where: { username: companyAdminUsername },
      });

      if (!process.env.COMPANY_ADMIN_PASSWORD) {
        logger.info('Company admin user ensured. Generated password.', {
          password: rawCompanyAdminPassword,
        });
      } else {
        logger.info(
          'Company admin user ensured (password from environment variable).',
        );
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
      logger.info('Sample company ensured.');

      await companyUserRepo.upsert(
        {
          companyId: company.id,
          role: CompanyUserRole.OWNER,
          userId: adminUser.id,
        },
        {
          conflictPaths: ['companyId', 'userId'],
          skipUpdateIfNoValuesChanged: true,
        },
      );

      // --- Sample customer ---
      const customerEmail =
        process.env.SAMPLE_CUSTOMER_EMAIL ?? 'customer@example.com';
      await customerRepo.upsert(
        {
          addresses: [
            {
              city: 'Townsville',
              companyId: company.id,
              state: 'CA',
              street: '123 Main St',
              zip: '12345',
            },
          ],
          companyId: company.id,
          email: customerEmail,
          name: 'John Doe',
          phone: '555-1234',
        },
        {
          conflictPaths: ['email', 'companyId'],
          skipUpdateIfNoValuesChanged: true,
        },
      );
      const customer = await customerRepo.findOneOrFail({
        where: { companyId: company.id, email: customerEmail },
      });
      logger.info('Sample customer ensured.');

      // --- Sample contract ---
      const contractStart = new Date('2024-01-01');
      let contract = await contractRepo.findOne({
        relations: ['customer'],
        where: {
          companyId: company.id,
          customer: { id: customer.id },
          startDate: contractStart,
        },
      });
      if (!contract) {
        contract = contractRepo.create({
          active: true,
          companyId: company.id,
          customer,
          frequency: ContractFrequency.MONTHLY,
          jobTemplate: {
            description: 'Recurring maintenance service',
            estimatedHours: 2,
            notes: 'Includes mowing and trimming',
            title: 'Monthly Lawn Care',
          },
          startDate: contractStart,
        });
        contract = await contractRepo.save(contract);
      }
      logger.info('Sample contract ensured.');

      // --- Sample job ---
      const existingJob = await jobRepo.findOne({
        where: {
          customer: { id: customer.id },
          title: 'Initial Lawn Care Visit',
        },
      });
      if (!existingJob) {
        await jobRepo.save({
          companyId: company.id,
          contract,
          customer,
          description: 'Kick-off job for the sample contract',
          scheduledDate: new Date(),
          title: 'Initial Lawn Care Visit',
        });
      }
      logger.info('Sample job ensured.');
    });

    logger.info('Database seeding completed successfully');
  } finally {
    await ds.destroy();
    logger.info('Database connection closed');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('Seeding failed', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
  });
