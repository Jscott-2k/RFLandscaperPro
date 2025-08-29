import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyIdToAddressAndAssignment1756447465689
  implements MigrationInterface
{
  name = 'AddCompanyIdToAddressAndAssignment1756447465689';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "address" ADD "companyId" integer`);
    await queryRunner.query(
      `UPDATE "address" a SET "companyId" = c."companyId" FROM "customer" c WHERE a."customerId" = c."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" ALTER COLUMN "companyId" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_address_companyId" ON "address" ("companyId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" ADD CONSTRAINT "FK_address_company" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`ALTER TABLE "assignment" ADD "companyId" integer`);
    await queryRunner.query(
      `UPDATE "assignment" a SET "companyId" = j."companyId" FROM "job" j WHERE a."jobId" = j."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ALTER COLUMN "companyId" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assignment_companyId" ON "assignment" ("companyId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_assignment_company" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_assignment_company"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_assignment_companyId"`);
    await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "companyId"`);

    await queryRunner.query(
      `ALTER TABLE "address" DROP CONSTRAINT "FK_address_company"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_address_companyId"`);
    await queryRunner.query(`ALTER TABLE "address" DROP COLUMN "companyId"`);
  }
}
