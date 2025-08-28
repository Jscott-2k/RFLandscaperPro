import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyContactFields1756422198641
  implements MigrationInterface
{
  name = 'AddCompanyContactFields1756422198641';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company" ADD "address" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "phone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "email" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "address"`);
  }
}
