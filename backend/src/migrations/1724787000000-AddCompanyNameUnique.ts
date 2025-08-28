import { MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class AddCompanyNameUnique1724787000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('company');
    const hasUnique = table?.uniques.some((uq) => uq.columnNames.length === 1 && uq.columnNames[0] === 'name');
    if (!hasUnique) {
      await queryRunner.createUniqueConstraint(
        'company',
        new TableUnique({ name: 'UQ_company_name', columnNames: ['name'] }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('company');
    const unique = table?.uniques.find((uq) => uq.name === 'UQ_company_name');
    if (unique) {
      await queryRunner.dropUniqueConstraint('company', unique);
    }
  }
}
