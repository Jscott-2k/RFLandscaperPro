import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class EnableRlsPolicies1756502290802 implements MigrationInterface {
  name = 'EnableRlsPolicies1756502290802';

  private readonly tables = [
    'contract',
    'company_user',
    'invitation',
    'equipment',
    'assignment',
    'job',
    'address',
    'customer',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(`
        CREATE POLICY ${table}_tenant_isolation ON "${table}"
          USING ("companyId" = current_setting('app.current_company_id', true)::int)
          WITH CHECK ("companyId" = current_setting('app.current_company_id', true)::int)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(
        `DROP POLICY IF EXISTS ${table}_tenant_isolation ON "${table}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`,
      );
    }
  }
}
