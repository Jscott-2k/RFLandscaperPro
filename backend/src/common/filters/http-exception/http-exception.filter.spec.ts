import { type LoggerService } from '@nestjs/common';

import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  it('should be defined', () => {
    const logger: LoggerService = {
      debug: () => undefined,
      error: () => undefined,
      log: () => undefined,
      verbose: () => undefined,
      warn: () => undefined,
    } as LoggerService;
    expect(new HttpExceptionFilter(logger)).toBeDefined();
  });
});
