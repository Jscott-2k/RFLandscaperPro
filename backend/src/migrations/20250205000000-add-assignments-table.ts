import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignmentsTable20250205000000 implements MigrationInterface {
  name = 'AddAssignmentsTable20250205000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "assignment" ("id" SERIAL NOT NULL, "jobId" integer, "userId" integer, "equipmentId" integer, CONSTRAINT "PK_assignment_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_assignment_job" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_assignment_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_assignment_equipment" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_assignment_equipment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_assignment_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_assignment_job"`,
    );
    await queryRunner.query(`DROP TABLE "assignment"`);
  }
}
