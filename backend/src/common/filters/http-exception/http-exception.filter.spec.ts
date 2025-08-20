import { HttpExceptionFilter } from './http-exception.filter';
import { LoggerService } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  it('should be defined', () => {
    const logger: LoggerService = {
      log: () => undefined,
      error: () => undefined,
      warn: () => undefined,
      debug: () => undefined,
      verbose: () => undefined,
    } as LoggerService;
    expect(new HttpExceptionFilter(logger)).toBeDefined();
  });
});
