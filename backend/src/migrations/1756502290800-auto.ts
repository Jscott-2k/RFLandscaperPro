import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class Auto1756502290800 implements MigrationInterface {
  name = 'Auto1756502290800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."contract_frequency_enum" AS ENUM('weekly', 'bi-weekly', 'monthly', 'bi-monthly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "contract" ("id" SERIAL NOT NULL, "companyId" integer NOT NULL, "startDate" date NOT NULL, "endDate" date, "frequency" "public"."contract_frequency_enum" NOT NULL, "totalOccurrences" integer, "occurrencesGenerated" integer NOT NULL DEFAULT '0', "jobTemplate" jsonb NOT NULL, "lastGeneratedDate" date, "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "customerId" integer NOT NULL, CONSTRAINT "PK_17c3a89f58a2997276084e706e8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."company_user_role_enum" AS ENUM('OWNER', 'ADMIN', 'WORKER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."company_user_status_enum" AS ENUM('ACTIVE', 'SUSPENDED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "company_user" ("id" SERIAL NOT NULL, "companyId" integer NOT NULL, "userId" integer NOT NULL, "role" "public"."company_user_role_enum" NOT NULL, "status" "public"."company_user_status_enum" NOT NULL DEFAULT 'ACTIVE', "invitedBy" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_company_user_companyId_userId" UNIQUE ("companyId", "userId"), CONSTRAINT "PK_879141ebc259b4c0544b3f1ea4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_company_user_userId" ON "company_user" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_company_user_companyId" ON "company_user" ("companyId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitation_role_enum" AS ENUM('ADMIN', 'WORKER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invitation" ("id" SERIAL NOT NULL, "companyId" integer NOT NULL, "email" character varying NOT NULL, "role" "public"."invitation_role_enum" NOT NULL, "tokenHash" character varying(128) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "acceptedAt" TIMESTAMP WITH TIME ZONE, "revokedAt" TIMESTAMP WITH TIME ZONE, "invitedBy" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_beb994737756c0f18a1c1f8669c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_invitation_active_unique" ON "invitation" ("companyId", "email") WHERE "acceptedAt" IS NULL AND "revokedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitation_expiresAt" ON "invitation" ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitation_email" ON "invitation" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitation_companyId" ON "invitation" ("companyId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "company" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "address" character varying, "phone" character varying, "email" character varying, "ownerId" integer, CONSTRAINT "UQ_a76c5cd486f7779bd9c319afd27" UNIQUE ("name"), CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."equipment_type_enum" AS ENUM('mower', 'trimmer', 'blower', 'tractor', 'truck', 'trailer', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."equipment_status_enum" AS ENUM('available', 'in_use', 'maintenance', 'out_of_service')`,
    );
    await queryRunner.query(
      `CREATE TABLE "equipment" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "type" "public"."equipment_type_enum" NOT NULL, "status" "public"."equipment_status_enum" NOT NULL DEFAULT 'available', "location" character varying, "description" text, "lastMaintenanceDate" date, "companyId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0722e1b9d6eb19f5874c1678740" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a16da66f48c0d276978498e41" ON "equipment" ("location") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b774512b2616c13a3b413624c9" ON "equipment" ("status", "type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "assignment" ("id" SERIAL NOT NULL, "companyId" integer NOT NULL, "startTime" TIMESTAMP, "endTime" TIMESTAMP, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "jobId" integer, "userId" integer, "equipmentId" integer, CONSTRAINT "PK_43c2f5a3859f54cedafb270f37e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_54ba4b79ff01ee17f73487857c" ON "assignment" ("companyId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_29c1b5aaf6573fe011d8a6b58b" ON "assignment" ("equipmentId", "jobId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12443a227cba68684ecd0e26a7" ON "assignment" ("userId", "jobId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "job" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text, "scheduledDate" date, "completed" boolean NOT NULL DEFAULT false, "estimatedHours" numeric(10,2), "actualHours" numeric(10,2), "notes" text, "companyId" integer NOT NULL, "contractId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "customerId" integer NOT NULL, CONSTRAINT "PK_98ab1c14ff8d1cf80d18703b92f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f0950c8aefa7c5f3a5520189e" ON "job" ("customerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a0044a5a1283e410a9a44922e" ON "job" ("scheduledDate", "completed") `,
    );
    await queryRunner.query(
      `CREATE TABLE "address" ("id" SERIAL NOT NULL, "street" character varying NOT NULL, "city" character varying NOT NULL, "state" character varying(2) NOT NULL, "zip" character varying(10) NOT NULL, "unit" character varying, "notes" text, "primary" boolean NOT NULL DEFAULT true, "companyId" integer NOT NULL, "customerId" integer, CONSTRAINT "PK_d92de1f82754668b5f5f5dd4fd5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c3fdf52cd6b4cbbeca8f5184fb" ON "address" ("companyId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93f04516d42d317945f5e84683" ON "address" ("street", "city", "state", "zip") `,
    );
    await queryRunner.query(
      `CREATE TABLE "customer" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "notes" text, "active" boolean NOT NULL DEFAULT true, "companyId" integer NOT NULL, "userId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_08c31a2c2908137891c74e1e085" UNIQUE ("email", "companyId"), CONSTRAINT "REL_3f62b42ed23958b120c235f74d" UNIQUE ("userId"), CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac1455877a69957f7466d5dc78" ON "customer" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fdb2f3ad8115da4c7718109a6e" ON "customer" ("email") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'master', 'owner', 'worker', 'customer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'customer', "isVerified" boolean NOT NULL DEFAULT false, "firstName" character varying, "lastName" character varying, "phone" character varying, "passwordResetToken" character varying(64), "passwordResetExpires" TIMESTAMP WITH TIME ZONE, "companyId" integer, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_password_reset_token" ON "users" ("passwordResetToken") `,
    );
    await queryRunner.query(
      `CREATE TABLE "verification_token" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_74bc3066ea24f13f37d52a12c79" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_token" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "isRevoked" boolean NOT NULL DEFAULT false, "userId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "FK_ba4311c222bf9285d9d06f3b477" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" ADD CONSTRAINT "FK_936abe955fb4bf453631ba04de9" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user" ADD CONSTRAINT "FK_92e4bc953bf0ca4c707f29b0ff8" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user" ADD CONSTRAINT "FK_b886c13768760ebda801512000b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user" ADD CONSTRAINT "FK_918eeb10742b8093a4a0192e136" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitation" ADD CONSTRAINT "FK_757968494b8501e4e3b27860fb0" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitation" ADD CONSTRAINT "FK_0a26eda5483cd889e0ace2fe748" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "FK_ee87438803acb531639e8284be0" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD CONSTRAINT "FK_2a71b4423071a434b29eb7a6855" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_7ba90fca6d054c56d8572cab731" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_b3ae3ab674b9ba61a5771e906da" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_9bf9a42ea97ab681df00c3e544f" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_54ba4b79ff01ee17f73487857ce" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_e66170573cabd565dab1132727d" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_8f0950c8aefa7c5f3a5520189e3" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_6206deb3a929e8fcaa28427964a" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" ADD CONSTRAINT "FK_c3fdf52cd6b4cbbeca8f5184fb3" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" ADD CONSTRAINT "FK_dc34d382b493ade1f70e834c4d3" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "FK_a9d874b83a7879be8538bf08b09" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "FK_3f62b42ed23958b120c235f74df" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_86586021a26d1180b0968f98502" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "verification_token" ADD CONSTRAINT "FK_0748c047a951e34c0b686bfadb2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_8e913e288156c133999341156ad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "verification_token" DROP CONSTRAINT "FK_0748c047a951e34c0b686bfadb2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_86586021a26d1180b0968f98502"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "FK_3f62b42ed23958b120c235f74df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "FK_a9d874b83a7879be8538bf08b09"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" DROP CONSTRAINT "FK_dc34d382b493ade1f70e834c4d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" DROP CONSTRAINT "FK_c3fdf52cd6b4cbbeca8f5184fb3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_6206deb3a929e8fcaa28427964a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_8f0950c8aefa7c5f3a5520189e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_e66170573cabd565dab1132727d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_54ba4b79ff01ee17f73487857ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_9bf9a42ea97ab681df00c3e544f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_b3ae3ab674b9ba61a5771e906da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_7ba90fca6d054c56d8572cab731"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" DROP CONSTRAINT "FK_2a71b4423071a434b29eb7a6855"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT "FK_ee87438803acb531639e8284be0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitation" DROP CONSTRAINT "FK_0a26eda5483cd889e0ace2fe748"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitation" DROP CONSTRAINT "FK_757968494b8501e4e3b27860fb0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user" DROP CONSTRAINT "FK_918eeb10742b8093a4a0192e136"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user" DROP CONSTRAINT "FK_b886c13768760ebda801512000b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_user" DROP CONSTRAINT "FK_92e4bc953bf0ca4c707f29b0ff8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "FK_936abe955fb4bf453631ba04de9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract" DROP CONSTRAINT "FK_ba4311c222bf9285d9d06f3b477"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_token"`);
    await queryRunner.query(`DROP TABLE "verification_token"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_password_reset_token"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fdb2f3ad8115da4c7718109a6e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac1455877a69957f7466d5dc78"`,
    );
    await queryRunner.query(`DROP TABLE "customer"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_93f04516d42d317945f5e84683"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c3fdf52cd6b4cbbeca8f5184fb"`,
    );
    await queryRunner.query(`DROP TABLE "address"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a0044a5a1283e410a9a44922e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8f0950c8aefa7c5f3a5520189e"`,
    );
    await queryRunner.query(`DROP TABLE "job"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_12443a227cba68684ecd0e26a7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_29c1b5aaf6573fe011d8a6b58b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_54ba4b79ff01ee17f73487857c"`,
    );
    await queryRunner.query(`DROP TABLE "assignment"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b774512b2616c13a3b413624c9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0a16da66f48c0d276978498e41"`,
    );
    await queryRunner.query(`DROP TABLE "equipment"`);
    await queryRunner.query(`DROP TYPE "public"."equipment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."equipment_type_enum"`);
    await queryRunner.query(`DROP TABLE "company"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invitation_companyId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invitation_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invitation_expiresAt"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_invitation_active_unique"`,
    );
    await queryRunner.query(`DROP TABLE "invitation"`);
    await queryRunner.query(`DROP TYPE "public"."invitation_role_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_company_user_companyId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_company_user_userId"`);
    await queryRunner.query(`DROP TABLE "company_user"`);
    await queryRunner.query(`DROP TYPE "public"."company_user_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."company_user_role_enum"`);
    await queryRunner.query(`DROP TABLE "contract"`);
    await queryRunner.query(`DROP TYPE "public"."contract_frequency_enum"`);
  }
}
