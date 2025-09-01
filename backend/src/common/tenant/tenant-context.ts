import { AsyncLocalStorage } from 'node:async_hooks';

type TenantStore = {
  companyId?: number;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getCurrentCompanyId(): number | undefined {
  return tenantStorage.getStore()?.companyId;
}

export function runWithCompanyId<T>(companyId: number, fn: () => T): T {
  return tenantStorage.run({ companyId }, fn);
}
