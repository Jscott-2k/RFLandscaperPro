import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddCompanyIdToEntities1719000003000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Customer
    await queryRunner.addColumn(
      'customer',
      new TableColumn({ name: 'companyId', type: 'int' }),
    );
    await queryRunner.createForeignKey(
      'customer',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'company',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Equipment
    await queryRunner.addColumn(
      'equipment',
      new TableColumn({ name: 'companyId', type: 'int' }),
    );
    await queryRunner.createForeignKey(
      'equipment',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'company',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Job
    await queryRunner.addColumn(
      'job',
      new TableColumn({ name: 'companyId', type: 'int' }),
    );
    await queryRunner.createForeignKey(
      'job',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'company',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Job
    const jobTable = await queryRunner.getTable('job');
    const jobFk = jobTable!.foreignKeys.find((fk) =>
      fk.columnNames.includes('companyId'),
    );
    if (jobFk) await queryRunner.dropForeignKey('job', jobFk);
    await queryRunner.dropColumn('job', 'companyId');

    // Equipment
    const equipmentTable = await queryRunner.getTable('equipment');
    const equipmentFk = equipmentTable!.foreignKeys.find((fk) =>
      fk.columnNames.includes('companyId'),
    );
    if (equipmentFk) await queryRunner.dropForeignKey('equipment', equipmentFk);
    await queryRunner.dropColumn('equipment', 'companyId');

    // Customer
    const customerTable = await queryRunner.getTable('customer');
    const customerFk = customerTable!.foreignKeys.find((fk) =>
      fk.columnNames.includes('companyId'),
    );
    if (customerFk) await queryRunner.dropForeignKey('customer', customerFk);
    await queryRunner.dropColumn('customer', 'companyId');
  }
}

