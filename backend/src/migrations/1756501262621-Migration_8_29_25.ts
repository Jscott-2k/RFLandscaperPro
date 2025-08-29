import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration829251756501262621 implements MigrationInterface {
    name = 'Migration829251756501262621'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer" DROP CONSTRAINT "UQ_customer_email_companyId"`);
        await queryRunner.query(`CREATE TYPE "public"."company_user_role_enum" AS ENUM('OWNER', 'ADMIN', 'WORKER')`);
        await queryRunner.query(`CREATE TYPE "public"."company_user_status_enum" AS ENUM('ACTIVE', 'SUSPENDED')`);
        await queryRunner.query(`CREATE TABLE "company_user" ("id" SERIAL NOT NULL, "companyId" integer NOT NULL, "userId" integer NOT NULL, "role" "public"."company_user_role_enum" NOT NULL, "status" "public"."company_user_status_enum" NOT NULL DEFAULT 'ACTIVE', "invitedBy" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_company_user_companyId_userId" UNIQUE ("companyId", "userId"), CONSTRAINT "PK_879141ebc259b4c0544b3f1ea4c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_company_user_userId" ON "company_user" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_company_user_companyId" ON "company_user" ("companyId") `);
        await queryRunner.query(`CREATE TYPE "public"."invitation_role_enum" AS ENUM('ADMIN', 'WORKER')`);
        await queryRunner.query(`CREATE TABLE "invitation" ("id" SERIAL NOT NULL, "companyId" integer NOT NULL, "email" character varying NOT NULL, "role" "public"."invitation_role_enum" NOT NULL, "tokenHash" character varying(128) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "acceptedAt" TIMESTAMP WITH TIME ZONE, "revokedAt" TIMESTAMP WITH TIME ZONE, "invitedBy" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_beb994737756c0f18a1c1f8669c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_invitation_active_unique" ON "invitation" ("companyId", "email") WHERE "acceptedAt" IS NULL AND "revokedAt" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_invitation_expiresAt" ON "invitation" ("expiresAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_invitation_email" ON "invitation" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_invitation_companyId" ON "invitation" ("companyId") `);
        await queryRunner.query(`CREATE TABLE "verification_token" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_74bc3066ea24f13f37d52a12c79" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD "companyId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "address" ADD "companyId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD "isVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_54ba4b79ff01ee17f73487857c" ON "assignment" ("companyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c3fdf52cd6b4cbbeca8f5184fb" ON "address" ("companyId") `);
        await queryRunner.query(`ALTER TABLE "customer" ADD CONSTRAINT "UQ_08c31a2c2908137891c74e1e085" UNIQUE ("email", "companyId")`);
        await queryRunner.query(`ALTER TABLE "company_user" ADD CONSTRAINT "FK_92e4bc953bf0ca4c707f29b0ff8" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_user" ADD CONSTRAINT "FK_b886c13768760ebda801512000b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_user" ADD CONSTRAINT "FK_918eeb10742b8093a4a0192e136" FOREIGN KEY ("invitedBy") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitation" ADD CONSTRAINT "FK_757968494b8501e4e3b27860fb0" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitation" ADD CONSTRAINT "FK_0a26eda5483cd889e0ace2fe748" FOREIGN KEY ("invitedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_54ba4b79ff01ee17f73487857ce" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "address" ADD CONSTRAINT "FK_c3fdf52cd6b4cbbeca8f5184fb3" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "verification_token" ADD CONSTRAINT "FK_0748c047a951e34c0b686bfadb2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verification_token" DROP CONSTRAINT "FK_0748c047a951e34c0b686bfadb2"`);
        await queryRunner.query(`ALTER TABLE "address" DROP CONSTRAINT "FK_c3fdf52cd6b4cbbeca8f5184fb3"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_54ba4b79ff01ee17f73487857ce"`);
        await queryRunner.query(`ALTER TABLE "invitation" DROP CONSTRAINT "FK_0a26eda5483cd889e0ace2fe748"`);
        await queryRunner.query(`ALTER TABLE "invitation" DROP CONSTRAINT "FK_757968494b8501e4e3b27860fb0"`);
        await queryRunner.query(`ALTER TABLE "company_user" DROP CONSTRAINT "FK_918eeb10742b8093a4a0192e136"`);
        await queryRunner.query(`ALTER TABLE "company_user" DROP CONSTRAINT "FK_b886c13768760ebda801512000b"`);
        await queryRunner.query(`ALTER TABLE "company_user" DROP CONSTRAINT "FK_92e4bc953bf0ca4c707f29b0ff8"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP CONSTRAINT "UQ_08c31a2c2908137891c74e1e085"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c3fdf52cd6b4cbbeca8f5184fb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_54ba4b79ff01ee17f73487857c"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isVerified"`);
        await queryRunner.query(`ALTER TABLE "address" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "companyId"`);
        await queryRunner.query(`DROP TABLE "verification_token"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_invitation_companyId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_invitation_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_invitation_expiresAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_invitation_active_unique"`);
        await queryRunner.query(`DROP TABLE "invitation"`);
        await queryRunner.query(`DROP TYPE "public"."invitation_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_company_user_companyId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_company_user_userId"`);
        await queryRunner.query(`DROP TABLE "company_user"`);
        await queryRunner.query(`DROP TYPE "public"."company_user_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."company_user_role_enum"`);
        await queryRunner.query(`ALTER TABLE "customer" ADD CONSTRAINT "UQ_customer_email_companyId" UNIQUE ("email", "companyId")`);
    }

}
