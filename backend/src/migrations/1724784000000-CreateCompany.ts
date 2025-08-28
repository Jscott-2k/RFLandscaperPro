import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateCompany1724784000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table
    await queryRunner.createTable(
      new Table({
        name: 'company',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'ownerId', type: 'int', isNullable: true },
        ],
      }),
    );

    // Optional index on ownerId
    await queryRunner.createIndex(
      'company',
      new TableIndex({
        name: 'IDX_company_ownerId',
        columnNames: ['ownerId'],
      }),
    );

    // FK: company.ownerId -> user.id
    await queryRunner.createForeignKey(
      'company',
      new TableForeignKey({
        name: 'FK_company_ownerId_user_id',
        columnNames: ['ownerId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('company', 'FK_company_ownerId_user_id');
    await queryRunner.dropIndex('company', 'IDX_company_ownerId');
    await queryRunner.dropTable('company');
  }
}
