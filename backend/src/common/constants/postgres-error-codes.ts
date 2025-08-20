import { QueryFailedError } from 'typeorm';

export const UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(
  error: unknown,
  code: string = UNIQUE_VIOLATION,
): boolean {
  return (
    error instanceof QueryFailedError &&
    (error as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code === code
  );
}
