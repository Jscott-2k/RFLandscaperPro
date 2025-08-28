import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  Table,
} from 'typeorm';

const FK_COMPANY = 'FK_customer_companyId_company_id';
const FK_USER = 'FK_customer_userId_user_id';

export class AddCustomerCompanyUser1724786000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure columns exist (nullable so it won't fail on existing rows)
    if (!(await queryRunner.hasColumn('customer', 'companyId'))) {
      await queryRunner.addColumn(
        'customer',
        new TableColumn({ name: 'companyId', type: 'int', isNullable: true }),
      );
    }
    if (!(await queryRunner.hasColumn('customer', 'userId'))) {
      await queryRunner.addColumn(
        'customer',
        new TableColumn({ name: 'userId', type: 'int', isNullable: true }),
      );
    }

    // Re-read table metadata after potential changes
    let table: Table | undefined = await queryRunner.getTable('customer');

    // Add FK: customer.companyId -> company.id (if missing)
    const hasCompanyFk =
      table?.foreignKeys.some((fk) => fk.name === FK_COMPANY) ?? false;

    if (!hasCompanyFk) {
      await queryRunner.createForeignKey(
        'customer',
        new TableForeignKey({
          name: FK_COMPANY,
          columnNames: ['companyId'],
          referencedTableName: 'company',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Add FK: customer.userId -> user.id (if missing)
    // (Do NOT quote "user"; TypeORM quotes it in SQL)
    table = await queryRunner.getTable('customer');
    const hasUserFk =
      table?.foreignKeys.some((fk) => fk.name === FK_USER) ?? false;

    if (!hasUserFk) {
      await queryRunner.createForeignKey(
        'customer',
        new TableForeignKey({
          name: FK_USER,
          columnNames: ['userId'],
          referencedTableName: 'user',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer');

    // Drop FKs if present (use FK objects, not just names)
    const fkCompany = table?.foreignKeys.find((fk) => fk.name === FK_COMPANY);
    if (fkCompany) {
      await queryRunner.dropForeignKey('customer', fkCompany);
    }

    const fkUser = table?.foreignKeys.find((fk) => fk.name === FK_USER);
    if (fkUser) {
      await queryRunner.dropForeignKey('customer', fkUser);
    }

    // Drop columns if present
    if (await queryRunner.hasColumn('customer', 'companyId')) {
      await queryRunner.dropColumn('customer', 'companyId');
    }
    if (await queryRunner.hasColumn('customer', 'userId')) {
      await queryRunner.dropColumn('customer', 'userId');
    }
  }
}
