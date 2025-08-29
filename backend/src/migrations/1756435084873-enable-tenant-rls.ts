import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableTenantRls1756435084873 implements MigrationInterface {
  name = 'EnableTenantRls1756435084873';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = ['customer', 'job', 'equipment', 'contract', 'user'];
    for (const table of tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(
        `CREATE POLICY "${table}_tenant_policy" ON "${table}" USING ("companyId" = current_setting('app.current_company_id')::int) WITH CHECK ("companyId" = current_setting('app.current_company_id')::int)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = ['customer', 'job', 'equipment', 'contract', 'user'];
    for (const table of tables) {
      await queryRunner.query(
        `DROP POLICY IF EXISTS "${table}_tenant_policy" ON "${table}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`,
      );
    }
  }
}
