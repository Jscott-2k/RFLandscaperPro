process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'appuser';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'rflandscaperpro_test';

import dataSource from '../data-source';
import { Company } from './companies/entities/company.entity';
import { Customer } from './customers/entities/customer.entity';
import { runWithCompanyId } from './common/tenant/tenant-context';
import { EnableTenantRls1756435084873 } from './migrations/1756435084873-enable-tenant-rls';

describe('RLS enforcement', () => {
  let company1: Company;
  let company2: Company;
  let customer1: Customer;
  let customer2: Customer;

  beforeAll(async () => {
    dataSource.setOptions({ synchronize: true, dropSchema: true, migrationsRun: false });
    await dataSource.initialize();
    const migration = new EnableTenantRls1756435084873();
    await migration.up(dataSource.createQueryRunner());
    const companyRepo = dataSource.getRepository(Company);
    const customerRepo = dataSource.getRepository(Customer);
    company1 = await companyRepo.save({ name: 'Company One' });
    company2 = await companyRepo.save({ name: 'Company Two' });
    customer1 = await runWithCompanyId(company1.id, () =>
      customerRepo.save({ name: 'Alice', email: 'alice@example.com', companyId: company1.id }),
    );
    customer2 = await runWithCompanyId(company2.id, () =>
      customerRepo.save({ name: 'Bob', email: 'bob@example.com', companyId: company2.id }),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('allows reading only own records', async () => {
    const customerRepo = dataSource.getRepository(Customer);
    const list = await runWithCompanyId(company1.id, () => customerRepo.find());
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(customer1.id);

    const other = await runWithCompanyId(company1.id, () =>
      customerRepo.findOne({ where: { id: customer2.id } }),
    );
    expect(other).toBeNull();
  });

  it('prevents creating records for another company', async () => {
    const qr = dataSource.createQueryRunner();
    await qr.startTransaction();
    await expect(
      runWithCompanyId(company1.id, () =>
        qr.manager.getRepository(Customer).save({
          name: 'Eve',
          email: 'eve@example.com',
          companyId: company2.id,
        }),
      ),
    ).rejects.toThrow();
    await qr.rollbackTransaction();
    await qr.release();
  });

  it('prevents updating records from another company', async () => {
    const customerRepo = dataSource.getRepository(Customer);
    const result = await runWithCompanyId(company1.id, () =>
      customerRepo.update({ id: customer2.id }, { name: 'Updated' }),
    );
    expect(result.affected).toBe(0);
  });

  it('prevents deleting records from another company', async () => {
    const customerRepo = dataSource.getRepository(Customer);
    const result = await runWithCompanyId(company1.id, () =>
      customerRepo.delete(customer2.id),
    );
    expect(result.affected).toBe(0);
  });
});
