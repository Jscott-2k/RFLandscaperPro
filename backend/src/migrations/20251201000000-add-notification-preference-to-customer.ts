import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationPreferenceToCustomer20251201000000
  implements MigrationInterface
{
  name = 'AddNotificationPreferenceToCustomer20251201000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "notificationPreference" character varying NOT NULL DEFAULT 'email'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "notificationPreference"`,
    );
  }
}
