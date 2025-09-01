import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class RenameUserTable1756754626440 implements MigrationInterface {
  name = 'RenameUserTable1756754626440';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" RENAME TO "users"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME TO "user"`);
  }
}
