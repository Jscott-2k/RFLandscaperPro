import { faker } from '@faker-js/faker';

import { Company } from '../src/companies/entities/company.entity';
import { Contract, ContractFrequency } from '../src/contracts/entities/contract.entity';
import { Customer } from '../src/customers/entities/customer.entity';
import dataSource from '../src/data-source';
import { Job } from '../src/jobs/entities/job.entity';

import 'dotenv/config';

type Options = {
  companies: number;
  contracts: number;
  customers: number;
  jobs: number;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Partial<Options> = {};
  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(\d+)$/);
    if (match) {
      const [, key, value] = match;
      if (['companies', 'customers', 'contracts', 'jobs'].includes(key)) {
        const k = key as keyof Options;
        opts[k] = Number(value);
      }
    }
  }
  return {
    companies: opts.companies ?? 1,
    contracts: opts.contracts ?? 2,
    customers: opts.customers ?? 10,
    jobs: opts.jobs ?? 3,
  };
}

async function seedSampleData() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding is disabled in production');
  }

  const { companies, contracts, customers, jobs } = parseArgs();
  const ds = await dataSource.initialize();
  try {
    await ds.transaction(async (trx) => {
      const companyRepo = trx.getRepository(Company);
      const customerRepo = trx.getRepository(Customer);
      const contractRepo = trx.getRepository(Contract);
      const jobRepo = trx.getRepository(Job);

      for (let c = 0; c < companies; c++) {
        const company = await companyRepo.save(
          companyRepo.create({
            address: faker.location.streetAddress(),
            email: faker.internet.email(),
            name: faker.company.name(),
            phone: faker.phone.number(),
          }),
        );

        for (let cu = 0; cu < customers; cu++) {
          const customer = await customerRepo.save(
            customerRepo.create({
              addresses: [
                {
                  city: faker.location.city(),
                  companyId: company.id,
                  primary: true,
                  state: faker.location.state({ abbreviated: true }),
                  street: faker.location.streetAddress(),
                  zip: faker.location.zipCode(),
                },
              ],
              companyId: company.id,
              email: faker.internet.email(),
              name: faker.person.fullName(),
              phone: faker.phone.number(),
            }),
          );

          for (let ct = 0; ct < contracts; ct++) {
            const contract = await contractRepo.save(
              contractRepo.create({
                active: true,
                companyId: company.id,
                customer,
                frequency: faker.helpers.arrayElement(
                  Object.values(ContractFrequency),
                ),
                jobTemplate: {
                  description: faker.lorem.sentence(),
                  estimatedHours: faker.number.int({ max: 8, min: 1 }),
                  title: faker.word.words(3),
                },
                startDate: faker.date.past(),
              }),
            );

            for (let j = 0; j < jobs; j++) {
              await jobRepo.save(
                jobRepo.create({
                  companyId: company.id,
                  contract,
                  customer,
                  description: faker.lorem.sentence(),
                  estimatedHours: faker.number.int({ max: 8, min: 1 }),
                  scheduledDate: faker.date.soon(),
                  title: faker.word.words(3),
                }),
              );
            }
          }
        }
      }
    });

    console.log('Sample data seeding completed successfully');
  } finally {
    await ds.destroy();
  }
}

seedSampleData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Sample data seeding failed:', err);
    process.exit(1);
  });
