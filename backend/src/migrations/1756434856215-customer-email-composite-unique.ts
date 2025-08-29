import { MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class CustomerEmailCompositeUnique1756434856215 implements MigrationInterface {
  name = 'CustomerEmailCompositeUnique1756434856215';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer');
    const emailUnique = table?.uniques.find(
      (uq) => uq.columnNames.length === 1 && uq.columnNames[0] === 'email',
    );
    if (emailUnique) {
      await queryRunner.dropUniqueConstraint(table!, emailUnique);
    }
    await queryRunner.createUniqueConstraint(
      table!,
      new TableUnique({
        name: 'UQ_customer_email_companyId',
        columnNames: ['email', 'companyId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('customer');
    const compositeUnique = table?.uniques.find(
      (uq) =>
        uq.columnNames.length === 2 &&
        uq.columnNames.includes('email') &&
        uq.columnNames.includes('companyId'),
    );
    if (compositeUnique) {
      await queryRunner.dropUniqueConstraint(table!, compositeUnique);
    }
    await queryRunner.createUniqueConstraint(
      table!,
      new TableUnique({ name: 'UQ_customer_email', columnNames: ['email'] }),
    );
  }
}
