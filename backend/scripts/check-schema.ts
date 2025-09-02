import 'reflect-metadata';
import dataSource from '../src/data-source';
import { PlatformTools } from 'typeorm/platform/PlatformTools';

async function main(): Promise<void> {
  let ds;
  try {
    ds = await dataSource.initialize();
    const sqlInMemory = await ds.driver.createSchemaBuilder().log();

    if (sqlInMemory.upQueries.length > 0) {
      console.error(
        PlatformTools.highlightSql(`Pending schema changes detected:`),
      );
      for (const { query } of sqlInMemory.upQueries) {
        const sql = query.trim().endsWith(';') ? query.trim() : `${query.trim()};`;
        console.error(PlatformTools.highlightSql(sql));
      }
      process.exitCode = 1;
    } else {
      console.log('Database schema is in sync.');
    }
  } catch (err) {
    console.error('Error during schema check:', err);
    process.exitCode = 1;
  } finally {
    if (ds) {
      await ds.destroy();
    }
  }
}

void main();
