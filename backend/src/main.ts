import { ValidationPipe, type LoggerService } from '@nestjs/common';
import { NestFactory, ModuleRef } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as winston from 'winston';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';

// src/main.ts
import 'reflect-metadata';

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  process.on('beforeExit', (c) => console.log('[lifecycle] beforeExit', c));
  process.on('exit', (c) => console.log('[lifecycle] exit', c));
  process.on('unhandledRejection', (e) =>
    console.error('[unhandledRejection]', e),
  );
  process.on('uncaughtException', (e) =>
    console.error('[uncaughtException]', e),
  );
}

function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function bootstrap(): Promise<void> {
  let app: NestExpressApplication | undefined;

  try {
    console.log('[boot] A: NestFactory.create() starting');

    // Create the app directly — no watchdog/Promise.race/keepalive
    const created = await NestFactory.create<NestExpressApplication>(
      AppModule,
      {
        bufferLogs: false,
        logger:
          process.env.NEST_LOG_LEVEL === 'debug'
            ? ['error', 'warn', 'log', 'debug', 'verbose']
            : undefined,
      },
    );
    const winstonLogger: LoggerService =
      created.get(WINSTON_MODULE_NEST_PROVIDER, { strict: false }) ??
      WinstonModule.createLogger({
        transports: [new winston.transports.Console()],
      });

    const appLocal = created;
    app = appLocal; // keep a reference for error logging below
    app.useLogger(winstonLogger);

    // Core HTTP config
    app.setGlobalPrefix('api');
    app.set('trust proxy', true);
    app.use(requestIdMiddleware);

    const loggingInterceptor = app.get(LoggingInterceptor, { strict: false });
    if (loggingInterceptor) {app.useGlobalInterceptors(loggingInterceptor);}

    app.useGlobalPipes(
      new ValidationPipe({
        errorHttpStatusCode: 422,
        forbidNonWhitelisted: true,
        stopAtFirstError: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        whitelist: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter(winstonLogger));

    // CORS
    const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
    app.enableCors({
      credentials: true,
      origin: isProd ? allowedOrigins : true,
    });

    // Swagger (dev only, behind basic auth)
    if (!isProd) {
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

      const swaggerConfig = new DocumentBuilder()
        .setTitle('RF Landscaper Pro API')
        .setDescription('Professional landscaping business management API')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();

      const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
      SwaggerModule.setup('docs', app, swaggerDoc);
      console.log('[boot] Swagger available at /docs');
    }

    // Optional provider enumeration when diagnosing boot issues
    if (process.env.DEBUG_PROVIDERS === '1') {
      try {
        const moduleRef = app.get(ModuleRef, { strict: false });
        const containerUnknown = (
          moduleRef as unknown as { container?: unknown }
        )?.container;

        type ProvidersMap = Map<unknown, unknown>;
        type ModuleRecord = { providers?: ProvidersMap };
        type ModulesMap = Map<unknown, ModuleRecord>;
        const getModules = (
          containerUnknown as {
            getModules?: () => ModulesMap;
          }
        )?.getModules;

        getModules?.().forEach((module, moduleName) => {
          module?.providers?.forEach((_provider, token) => {
            console.debug(
              `[provider:init] ${String(token)} in ${String(moduleName)}`,
            );
          });
        });
      } catch (err) {
        console.warn('[boot] provider enumeration failed', err);
      }
    }

    const host = process.env.HOST || '0.0.0.0';
    const port = Number(process.env.PORT ?? 3000);

    console.log('[boot] C: starting app.listen()');
    app.enableShutdownHooks();
    await app.listen(port, host);
    console.log(`[boot] D: listening on http://${host}:${port}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;

    try {
      app
        ?.get(WINSTON_MODULE_NEST_PROVIDER, { strict: false })
        ?.error?.('Bootstrap error', stack ?? msg);
    } catch (nestedErr) {
      console.warn('[boot] failed to log with winston', nestedErr);
    }

    console.error('[boot] FATAL:', msg, stack);
    // non-zero exit so tooling catches the failure, but no watchdog timers
    process.exit(1);
  }
}

if (require.main === module) {
  void bootstrap();
}
