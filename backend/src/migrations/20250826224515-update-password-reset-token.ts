import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePasswordResetToken20250826224515 implements MigrationInterface {
  name = 'UpdatePasswordResetToken20250826224515';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "passwordResetToken" TYPE character varying(64)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_password_reset_token" ON "user" ("passwordResetToken")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_user_password_reset_token"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "passwordResetToken" TYPE character varying(255)`
    );
  }
}
