import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExceptionFilter, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception/http-exception.filter';
import {
  WINSTON_MODULE_NEST_PROVIDER,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  let app;
  try {
    app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.use(requestIdMiddleware);
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
    const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
    app.useGlobalInterceptors(app.get(LoggingInterceptor));
    logger.log(
      `Starting backend in ${process.env.NODE_ENV || 'development'} mode`,
    );
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(
      new HttpExceptionFilter(logger) satisfies ExceptionFilter,
    );
    await app.listen(process.env.PORT || 3000, '0.0.0.0');
  } catch (error) {
    const logger =
      app?.get(WINSTON_MODULE_NEST_PROVIDER) ||
      WinstonModule.createLogger({
        transports: [new winston.transports.Console()],
      });
    logger.error('Bootstrap error:', error);
    process.exit(1);
  }
}
bootstrap();
