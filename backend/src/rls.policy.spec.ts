import { runWithCompanyId } from './common/tenant/tenant-context';
import { Company } from './companies/entities/company.entity';
import { Customer } from './customers/entities/customer.entity';

process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'appuser';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'rflandscaperpro_test';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dataSource = require('./data-source').default;

async function enableCustomerRls() {
  const qr = dataSource.createQueryRunner();
  await qr.query('ALTER TABLE "customer" ENABLE ROW LEVEL SECURITY');
  await qr.query(
    'DROP POLICY IF EXISTS customer_tenant_isolation ON "customer"',
  );
  await qr.query(`
    CREATE POLICY customer_tenant_isolation ON "customer"
      USING ("companyId" = current_setting('app.current_company_id', true)::int)
      WITH CHECK ("companyId" = current_setting('app.current_company_id', true)::int)
  `);
  await qr.release();
}

describe.skip('RLS enforcement', () => {
  let company1: Company;
  let company2: Company;
  let customer1: Customer;
  let customer2: Customer;

  beforeAll(async () => {
    dataSource.setOptions({
      dropSchema: true,
      migrationsRun: false,
      synchronize: true,
    });
    await dataSource.initialize();
    await enableCustomerRls();
    const companyRepo = dataSource.getRepository(Company);
    const customerRepo = dataSource.getRepository(Customer);
    company1 = await companyRepo.save({ name: 'Company One' });
    company2 = await companyRepo.save({ name: 'Company Two' });
    customer1 = await runWithCompanyId(company1.id, () =>
      customerRepo.save({
        companyId: company1.id,
        email: 'alice@example.com',
        name: 'Alice',
      }),
    );
    customer2 = await runWithCompanyId(company2.id, () =>
      customerRepo.save({
        companyId: company2.id,
        email: 'bob@example.com',
        name: 'Bob',
      }),
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
          companyId: company2.id,
          email: 'eve@example.com',
          name: 'Eve',
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
