import {
  Module,
  Injectable,
  Inject,
  type LoggerService,
  Global,
} from '@nestjs/common';
import { makeCounterProvider, InjectMetric } from '@willsoto/nestjs-prometheus';
import {
  WinstonModule,
  WINSTON_MODULE_NEST_PROVIDER,
  WINSTON_MODULE_PROVIDER,
} from 'nest-winston';
import { type Counter } from 'prom-client';
import * as winston from 'winston';

import { getRequestId } from '../common/middleware/request-id.middleware';
import { getCurrentCompanyId } from '../common/tenant/tenant-context';
import { getCurrentUserId } from '../common/user/user-context';

const transports: winston.transport[] = [
  new winston.transports.Console(),
  new winston.transports.File({ filename: 'app.log' }),
];

if (process.env.REMOTE_LOG_HOST) {
  transports.push(
    new winston.transports.Http({
      host: process.env.REMOTE_LOG_HOST,
      path: process.env.REMOTE_LOG_PATH || '/',
      port: process.env.REMOTE_LOG_PORT
        ? Number(process.env.REMOTE_LOG_PORT)
        : 1234,
    }),
  );
}

const LOG_LEVELS = ['error', 'warn', 'info', 'debug', 'verbose'] as const;

@Injectable()
class PrometheusLogger implements LoggerService {
  private readonly counters: Record<
    (typeof LOG_LEVELS)[number],
    Counter<string>
  >;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: winston.Logger,
    @InjectMetric('log_error_total') errorCounter: Counter<string>,
    @InjectMetric('log_warn_total') warnCounter: Counter<string>,
    @InjectMetric('log_info_total') infoCounter: Counter<string>,
    @InjectMetric('log_debug_total') debugCounter: Counter<string>,
    @InjectMetric('log_verbose_total') verboseCounter: Counter<string>,
  ) {
    this.counters = {
      debug: debugCounter,
      error: errorCounter,
      info: infoCounter,
      verbose: verboseCounter,
      warn: warnCounter,
    };
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.counters.info.inc();
    this.logger.info?.(message, ...optionalParams);
  }
  error(message: unknown, ...optionalParams: unknown[]): void {
    this.counters.error.inc();
    this.logger.error?.(message, ...optionalParams);
  }
  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.counters.warn.inc();
    this.logger.warn?.(message, ...optionalParams);
  }
  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.counters.debug.inc();
    this.logger.debug?.(message, ...optionalParams);
  }
  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.counters.verbose.inc();
    this.logger.verbose?.(message, ...optionalParams);
  }
}

@Global()
@Module({
  exports: [WINSTON_MODULE_NEST_PROVIDER],
  imports: [
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format((info) => {
          return Object.assign(info, {
            companyId: getCurrentCompanyId() ?? null,
            requestId: getRequestId() ?? null,
            userId: getCurrentUserId() ?? null,
          });
        })(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
      level: process.env.LOG_LEVEL || 'info',
      transports,
    }),
  ],
  providers: [
    ...LOG_LEVELS.map((level) =>
      makeCounterProvider({
        help: `Total number of ${level} logs`,
        name: `log_${level}_total`,
      }),
    ),
    PrometheusLogger,
    { provide: WINSTON_MODULE_NEST_PROVIDER, useExisting: PrometheusLogger },
  ],
})
export class LoggerModule {}
