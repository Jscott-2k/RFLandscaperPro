import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyEntity20250918120000 implements MigrationInterface {
  name = 'AddCompanyEntity20250918120000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "company" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_company_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "companyId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "companyId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD "companyId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD "companyId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_user_company" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "FK_customer_company" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_job_company" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD CONSTRAINT "FK_equipment_company" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "equipment" DROP CONSTRAINT "FK_equipment_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_job_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "FK_customer_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_user_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" DROP COLUMN "companyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" DROP COLUMN "companyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "companyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "companyId"`,
    );
    await queryRunner.query(`DROP TABLE "company"`);
  }
}
