import { Module, Injectable, Inject, LoggerService } from '@nestjs/common';
import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as winston from 'winston';
import { makeCounterProvider, InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

const transports: winston.transport[] = [
  new winston.transports.Console(),
  new winston.transports.File({ filename: 'app.log' }),
];

if (process.env.REMOTE_LOG_HOST) {
  transports.push(
    new winston.transports.Http({
      host: process.env.REMOTE_LOG_HOST,
      port: process.env.REMOTE_LOG_PORT
        ? Number(process.env.REMOTE_LOG_PORT)
        : 1234,
      path: process.env.REMOTE_LOG_PATH || '/',
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
    @Inject('BASE_LOGGER') private readonly logger: LoggerService,
    @InjectMetric('log_error_total') errorCounter: Counter<string>,
    @InjectMetric('log_warn_total') warnCounter: Counter<string>,
    @InjectMetric('log_info_total') infoCounter: Counter<string>,
    @InjectMetric('log_debug_total') debugCounter: Counter<string>,
    @InjectMetric('log_verbose_total') verboseCounter: Counter<string>,
  ) {
    this.counters = {
      error: errorCounter,
      warn: warnCounter,
      info: infoCounter,
      debug: debugCounter,
      verbose: verboseCounter,
    };
  }

  log(message: any, ...optionalParams: any[]) {
    this.counters.info.inc();
    this.logger.log(message, ...optionalParams);
  }
  error(message: any, ...optionalParams: any[]) {
    this.counters.error.inc();
    this.logger.error(message, ...optionalParams);
  }
  warn(message: any, ...optionalParams: any[]) {
    this.counters.warn.inc();
    this.logger.warn(message, ...optionalParams);
  }
  debug(message: any, ...optionalParams: any[]) {
    this.counters.debug.inc();
    this.logger.debug(message, ...optionalParams);
  }
  verbose(message: any, ...optionalParams: any[]) {
    this.counters.verbose.inc();
    this.logger.verbose(message, ...optionalParams);
  }
}

@Module({
  imports: [
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      transports,
    }),
  ],
  providers: [
    ...LOG_LEVELS.map((level) =>
      makeCounterProvider({
        name: `log_${level}_total`,
        help: `Total number of ${level} logs`,
      }),
    ),
    { provide: 'BASE_LOGGER', useExisting: WINSTON_MODULE_NEST_PROVIDER },
    PrometheusLogger,
    { provide: WINSTON_MODULE_NEST_PROVIDER, useExisting: PrometheusLogger },
  ],
  exports: [WINSTON_MODULE_NEST_PROVIDER],
})
export class LoggerModule {}
