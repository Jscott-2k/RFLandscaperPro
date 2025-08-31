import { DataSource, QueryRunner } from 'typeorm';
import { getCurrentCompanyId } from './common/tenant/tenant-context';
import typeOrmConfig from './database/typeorm.config';

const dataSource = new DataSource(typeOrmConfig);

type CreateQR = DataSource['createQueryRunner'];

const originalCreateQueryRunner: CreateQR = (
  ...args: Parameters<CreateQR>
): ReturnType<CreateQR> => dataSource.createQueryRunner(...args);

dataSource.createQueryRunner = (
  ...args: Parameters<CreateQR>
): ReturnType<CreateQR> => {
  const queryRunner = originalCreateQueryRunner(...args);
  const originalQuery = queryRunner.query.bind(queryRunner) as (
    query: string,
    parameters?: unknown[],
  ) => Promise<unknown>;

  queryRunner.query = (async (
    query: string,
    parameters?: unknown[],
  ): Promise<unknown> => {
    const companyId = getCurrentCompanyId();
    const runnerData = (queryRunner.data ?? {}) as {
      companyId?: number;
      [key: string]: unknown;
    };
    if (
      companyId !== undefined &&
      typeof query === 'string' &&
      !query.startsWith('SET app.current_company_id') &&
      runnerData.companyId !== companyId
    ) {
      await originalQuery(`SET app.current_company_id = ${companyId}`);
      queryRunner.data = { ...(queryRunner.data || {}), companyId };
      queryRunner.data = { ...runnerData, companyId };
    }

    return originalQuery(query, parameters);
  }) as QueryRunner['query'];

  return queryRunner;
};

export default dataSource;
