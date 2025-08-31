import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ExceptionFilter,
  ValidationPipe,
  Logger,
  INestApplication,
} from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception/http-exception.filter';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';

process.on('beforeExit', (c) => console.log('[lifecycle] beforeExit', c));
process.on('exit', (c) => console.log('[lifecycle] exit', c));

async function bootstrap() {
  let app: INestApplication | undefined;
  const logger = new Logger('Bootstrap');

  try {
    app = await NestFactory.create(AppModule, { bufferLogs: true });

    // Prefix all routes with /api
    app.setGlobalPrefix('api');

    // Apply middleware
    app.use(requestIdMiddleware);

    // Setup logging
    app.useLogger(app.get<Logger>(WINSTON_MODULE_NEST_PROVIDER));
    const winstonLogger = app.get<Logger>(WINSTON_MODULE_NEST_PROVIDER);

    // Apply interceptors
    app.useGlobalInterceptors(app.get<LoggingInterceptor>(LoggingInterceptor));

    logger.log(
      `Starting backend in ${process.env.NODE_ENV || 'development'} mode`,
    );

    // Enable CORS
    app.enableCors({
      origin:
        process.env.NODE_ENV === 'production'
          ? process.env.ALLOWED_ORIGINS?.split(',') || []
          : true,
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        errorHttpStatusCode: 422,
      }),
    );

    // Global exception filter
    app.useGlobalFilters(
      new HttpExceptionFilter(winstonLogger) satisfies ExceptionFilter,
    );

    // Swagger documentation with basic auth
    if (process.env.NODE_ENV !== 'production') {
      app.use(
        ['/docs', '/docs-json'],
        basicAuth({
          challenge: true,
          users: {
            [process.env.SWAGGER_USER || 'admin']:
              process.env.SWAGGER_PASSWORD || 'admin',
          },
        }),
      );

      const config = new DocumentBuilder()
        .setTitle('RF Landscaper Pro API')
        .setDescription('Professional landscaping business management API')
        .setVersion('1.0.0')
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management')
        .addTag('customers', 'Customer management')
        .addTag('jobs', 'Job management')
        .addTag('equipment', 'Equipment management')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document);

      logger.log('Swagger documentation available at /docs');
    }

    // Start the application
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    logger.log(`About to listen on ${host}:${port}...`);
    await app.listen(port, host);
    logger.log(`Application is running on: http://${host}:${port}`);
  } catch (error) {
    const errorLogger =
      app?.get<Logger>(WINSTON_MODULE_NEST_PROVIDER) ||
      WinstonModule.createLogger({
        transports: [new winston.transports.Console()],
      });

    if (error instanceof Error) {
      errorLogger.error(`Bootstrap error: ${error.message}`, {
        stack: error.stack,
      });
      logger.error(
        `Failed to start application: ${error.message}`,
        error.stack,
      );
    } else {
      const serialized = JSON.stringify(error);
      errorLogger.error(`Bootstrap error: ${serialized}`);
      logger.error(`Failed to start application: ${serialized}`);
    }
    process.exit(1);
  }
}

process.on('exit', (code) => {
  const logger = new Logger('Process');
  logger.log(`Process exiting with code ${code}`);
});
process.on('unhandledRejection', (reason) => {
  const logger = new Logger('Process');
  logger.error(`Unhandled rejection: ${JSON.stringify(reason)}`);
});
process.on('uncaughtException', (err) => {
  const logger = new Logger('Process');
  logger.error(`Uncaught exception: ${err.message}`, err.stack);
});

void (async () => {
  try {
    await bootstrap();
  } catch (err) {
    const logger = new Logger('Bootstrap');
    logger.error(
      err instanceof Error ? err.message : String(err),
      err instanceof Error ? err.stack : undefined,
    );
    process.exit(1);
  }
})();
