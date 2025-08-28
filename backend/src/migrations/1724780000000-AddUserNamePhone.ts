// src/migrations/1724780000000-AddUserNamePhone.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserNamePhone1724780000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('user', [
      new TableColumn({ name: 'firstName', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'lastName', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'phone', type: 'varchar', isNullable: true }),
    ]);

    // Optional backfill (set blanks to empty strings)
    await queryRunner.query(
      `UPDATE "user" SET "firstName" = COALESCE("firstName", '')`,
    );
    await queryRunner.query(
      `UPDATE "user" SET "lastName"  = COALESCE("lastName",  '')`,
    );
    await queryRunner.query(
      `UPDATE "user" SET "phone"     = COALESCE("phone",     '')`,
    );

    // If you want NOT NULL later, do it in a later migration *after* backfill:
    // await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "firstName" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'phone');
    await queryRunner.dropColumn('user', 'lastName');
    await queryRunner.dropColumn('user', 'firstName');
  }
}
