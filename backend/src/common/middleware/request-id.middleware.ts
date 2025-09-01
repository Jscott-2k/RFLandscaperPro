import { type Request, type Response, type NextFunction } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

type RequestStore = {
  requestId: string;
}

type RequestWithId = {
  requestId?: string;
} & Request

export const requestIdStorage = new AsyncLocalStorage<RequestStore>();

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = randomUUID();
  requestIdStorage.run({ requestId }, () => {
    (req as RequestWithId).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });
}

export function getRequestId(): string | undefined {
  return requestIdStorage.getStore()?.requestId;
}
