import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddCompany1717000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
          { name: 'name', type: 'varchar' },
          { name: 'ownerId', type: 'int', isNullable: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'company',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'companyId',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'user',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'company',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const userTable = await queryRunner.getTable('user');
    const companyIdFk = userTable!.foreignKeys.find((fk) =>
      fk.columnNames.includes('companyId'),
    );
    if (companyIdFk) {
      await queryRunner.dropForeignKey('user', companyIdFk);
    }
    await queryRunner.dropColumn('user', 'companyId');

    const companyTable = await queryRunner.getTable('company');
    if (companyTable) {
      const ownerFk = companyTable.foreignKeys.find((fk) =>
        fk.columnNames.includes('ownerId'),
      );
      if (ownerFk) {
        await queryRunner.dropForeignKey('company', ownerFk);
      }
      await queryRunner.dropTable('company');
    }
  }
}
