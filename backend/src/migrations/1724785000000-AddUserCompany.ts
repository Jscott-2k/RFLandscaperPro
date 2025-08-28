import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddUserCompany1724785000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) add column (nullable first so it doesn't fail on existing rows)
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'companyId',
        type: 'integer',
        isNullable: true,
      }),
    );

    // 2) add FK
    await queryRunner.createForeignKey(
      'user',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'company',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        name: 'FK_user_companyId_company_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('user', 'FK_user_companyId_company_id');
    await queryRunner.dropColumn('user', 'companyId');
  }
}
