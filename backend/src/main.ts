// src/main.ts
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory, ModuleRef } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import * as winston from 'winston';
import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception/http-exception.filter';

// helpful in dev
process.on('beforeExit', (c) => console.log('[lifecycle] beforeExit', c));
process.on('exit', (c) => console.log('[lifecycle] exit', c));
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', e));

async function createAppWithWatchdog(): Promise<NestExpressApplication> {
  console.log('[boot] A: NestFactory.create() starting');

  process.env.NEST_DEBUG = 'true';
  const keepalive = setInterval(() => {}, 1 << 30);
  const timeoutMs = Number(process.env.BOOT_CREATE_TIMEOUT_MS ?? 15000);

  try {
    const app = await Promise.race([
      NestFactory.create<NestExpressApplication>(AppModule, {
        bufferLogs: true,
        logger:
          process.env.NEST_LOG_LEVEL === 'debug'
            ? ['error', 'warn', 'log', 'debug', 'verbose']
            : undefined,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `NestFactory.create timed out after ${timeoutMs}ms. Likely a hanging provider in AppModule (e.g., DB connect in a useFactory/constructor).`,
              ),
            ),
          timeoutMs,
        ),
      ),
    ]);

    console.log('[boot] B: after create()');
    return app;
  } finally {
    clearInterval(keepalive);
  }
}

export async function bootstrap(): Promise<void> {
  let app: NestExpressApplication | undefined;

  try {
    console.time('createAppWithWatchdog');
    app = await createAppWithWatchdog();
    console.timeEnd('createAppWithWatchdog');

    const moduleRef = app.get(ModuleRef, { strict: false });
    try {
      const modules = (moduleRef as any)?.container?.getModules?.();
      modules?.forEach((module, moduleName) => {
        module.providers.forEach((_provider, token) =>
          console.debug(`[provider:init] ${String(token)} in ${String(moduleName)}`),
        );
      });
    } catch {}

    const winstonLogger =
      app.get(WINSTON_MODULE_NEST_PROVIDER, { strict: false }) ??
      WinstonModule.createLogger({ transports: [new winston.transports.Console()] });
    app.useLogger(winstonLogger);

    // Core setup
    app.setGlobalPrefix('api');
    app.set('trust proxy', true); // typed & valid for Express
    app.use(requestIdMiddleware);

    // If LoggingInterceptor is provided in DI, this resolves it
    app.useGlobalInterceptors(app.get(LoggingInterceptor));

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        errorHttpStatusCode: 422,
        stopAtFirstError: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter(winstonLogger as any));

    const isProd = process.env.NODE_ENV === 'production';
    const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    app.enableCors({ origin: isProd ? allowedOrigins : true, credentials: true });

    if (!isProd) {
      app.use(
        ['/docs', '/docs-json'],
        basicAuth({
          challenge: true,
          users: {
            [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASSWORD || 'admin',
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

    const host = process.env.HOST || '0.0.0.0';
    const port = Number(process.env.PORT ?? 3000);
    await app.init();
    console.log('[boot] C: after app.init()');

    app.enableShutdownHooks();
    await app.listen(port, host);
    console.log(`[boot] D: listening on http://${host}:${port}`);
  } catch (err: any) {
    try {
      app?.get(WINSTON_MODULE_NEST_PROVIDER, { strict: false })?.error?.(
        'Bootstrap error',
        err?.stack || err,
      );
    } catch {}
    console.error('[boot] FATAL:', err?.message || err, err?.stack);
    process.exit(1);
  }
}

// run when executed directly
if (require.main === module) {
  bootstrap();
}
