import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';

interface RequestStore {
  requestId: string;
}

export const requestIdStorage = new AsyncLocalStorage<RequestStore>();

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = randomUUID();
  requestIdStorage.run({ requestId }, () => {
    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });
}

export function getRequestId(): string | undefined {
  return requestIdStorage.getStore()?.requestId;
}
