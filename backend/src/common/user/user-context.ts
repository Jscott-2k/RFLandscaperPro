import { AsyncLocalStorage } from 'node:async_hooks';

type UserStore = {
  userId?: number;
}

export const userStorage = new AsyncLocalStorage<UserStore>();

export function getCurrentUserId(): number | undefined {
  return userStorage.getStore()?.userId;
}

export function runWithUserId<T>(userId: number, fn: () => T): T {
  return userStorage.run({ userId }, fn);
}
