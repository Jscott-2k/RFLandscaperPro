import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type LoggerService,
  type NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { type Request, type Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { type Histogram } from 'prom-client';
import { type Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

type RequestWithRoute = {
  route: { path?: string };
} & Request

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectMetric('http_request_duration_seconds')
    private readonly histogram: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, url } = request;
    const routePath = (request as RequestWithRoute).route?.path ?? url;
    const start = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const response = ctx.getResponse<Response>();
        const { statusCode } = response;
        const duration = Date.now() - start;
        this.logger.log(`HTTP ${method} ${url} ${statusCode} ${duration}ms`);
        this.histogram
          .labels(method, routePath, statusCode.toString())
          .observe(duration / 1000);
      }),
    );
  }
}
