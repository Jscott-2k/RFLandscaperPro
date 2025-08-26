import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueEmailToCustomer20250819192350
  implements MigrationInterface
{
  name = 'AddUniqueEmailToCustomer20250819192350';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "UQ_customer_email" UNIQUE ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "UQ_customer_email"`,
    );
  }
}
