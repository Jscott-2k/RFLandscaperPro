import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserDetails1718000000000 implements MigrationInterface {
  name = 'AddUserDetails1718000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "firstName" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD "lastName" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD "phone" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "lastName"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "firstName"`);
  }
}
