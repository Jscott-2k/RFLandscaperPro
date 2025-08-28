import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddCustomerCompanyUser1724786000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // add columns if missing
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

    // add FKs if missing
    const table = await queryRunner.getTable('customer');
    const hasCompanyFk = table?.foreignKeys.some((fk) =>
      fk.columnNames.includes('companyId'),
    );
    const hasUserFk = table?.foreignKeys.some((fk) =>
      fk.columnNames.includes('userId'),
    );

    if (!hasCompanyFk) {
      await queryRunner.createForeignKey(
        'customer',
        new TableForeignKey({
          name: 'FK_customer_companyId_company_id',
          columnNames: ['companyId'],
          referencedTableName: 'company',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    if (!hasUserFk) {
      await queryRunner.createForeignKey(
        'customer',
        new TableForeignKey({
          name: 'FK_customer_userId_user_id',
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
    // drop FKs (ignore if already gone)
    try {
      await queryRunner.dropForeignKey(
        'customer',
        'FK_customer_companyId_company_id',
      );
    } catch {
      // ignore if foreign key does not exist
    }
    try {
      await queryRunner.dropForeignKey(
        'customer',
        'FK_customer_userId_user_id',
      );
    } catch {
      // ignore if foreign key does not exist
    }

    // drop columns
    if (await queryRunner.hasColumn('customer', 'companyId')) {
      await queryRunner.dropColumn('customer', 'companyId');
    }
    if (await queryRunner.hasColumn('customer', 'userId')) {
      await queryRunner.dropColumn('customer', 'userId');
    }
  }
}
