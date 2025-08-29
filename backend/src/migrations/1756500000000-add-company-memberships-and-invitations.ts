import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyMembershipsAndInvitations1756500000000
  implements MigrationInterface
{
  name = 'AddCompanyMembershipsAndInvitations1756500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "company" ADD "ownerId" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_company_ownerId" ON "company" ("ownerId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "FK_company_owner" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."company_user_role_enum" AS ENUM('OWNER','ADMIN','WORKER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."company_user_status_enum" AS ENUM('ACTIVE','SUSPENDED')`,
    );
    await queryRunner.query(`CREATE TABLE "company_user" (
        "id" SERIAL NOT NULL,
        "companyId" integer NOT NULL,
        "userId" integer NOT NULL,
        "role" "public"."company_user_role_enum" NOT NULL,
        "status" "public"."company_user_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "invitedBy" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_user_id" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_company_user_companyId_userId" ON "company_user" ("companyId","userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_company_user_companyId" ON "company_user" ("companyId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_company_user_userId" ON "company_user" ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user" ADD CONSTRAINT "FK_company_user_company" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user" ADD CONSTRAINT "FK_company_user_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user" ADD CONSTRAINT "FK_company_user_invitedBy" FOREIGN KEY ("invitedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."invitation_role_enum" AS ENUM('ADMIN','WORKER')`,
    );
    await queryRunner.query(`CREATE TABLE "invitation" (
        "id" SERIAL NOT NULL,
        "companyId" integer NOT NULL,
        "email" character varying NOT NULL,
        "role" "public"."invitation_role_enum" NOT NULL,
        "tokenHash" character varying(128) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "acceptedAt" TIMESTAMP,
        "revokedAt" TIMESTAMP,
        "invitedBy" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invitation_id" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_invitation_companyId" ON "invitation" ("companyId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitation_email" ON "invitation" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitation_expiresAt" ON "invitation" ("expiresAt")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_invitation_active_unique" ON "invitation" ("companyId","email") WHERE "acceptedAt" IS NULL AND "revokedAt" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitation" ADD CONSTRAINT "FK_invitation_company" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitation" ADD CONSTRAINT "FK_invitation_invitedBy" FOREIGN KEY ("invitedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invitation" DROP CONSTRAINT "FK_invitation_invitedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitation" DROP CONSTRAINT "FK_invitation_company"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_invitation_active_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_invitation_expiresAt"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_invitation_email"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_invitation_companyId"`,
    );
    await queryRunner.query(`DROP TABLE "invitation"`);
    await queryRunner.query(`DROP TYPE "public"."invitation_role_enum"`);

    await queryRunner.query(
      `ALTER TABLE "company_user" DROP CONSTRAINT "FK_company_user_invitedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user" DROP CONSTRAINT "FK_company_user_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user" DROP CONSTRAINT "FK_company_user_company"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_company_user_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_company_user_companyId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_company_user_companyId_userId"`,
    );
    await queryRunner.query(`DROP TABLE "company_user"`);
    await queryRunner.query(`DROP TYPE "public"."company_user_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."company_user_role_enum"`);

    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT "FK_company_owner"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_company_ownerId"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "ownerId"`);
  }
}

