import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserRoleEnum1756502290801 implements MigrationInterface {
  name = 'RenameUserRoleEnum1756502290801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_enum" RENAME VALUE 'admin' TO 'company_admin'`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_enum" RENAME VALUE 'owner' TO 'company_owner'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_enum" RENAME VALUE 'company_owner' TO 'owner'`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_enum" RENAME VALUE 'company_admin' TO 'admin'`
    );
  }
}
