import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToCustomer1717000001000 implements MigrationInterface {
  name = 'AddUserIdToCustomer1717000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customer" ADD "userId" integer`);
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "UQ_customer_userId" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "FK_customer_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "FK_customer_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "UQ_customer_userId"`,
    );
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "userId"`);
  }
}
