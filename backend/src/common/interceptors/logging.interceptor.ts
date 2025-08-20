import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  LoggerService,
  NestInterceptor,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Request, Response } from 'express';
import { getRequestId } from '../middleware/request-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const response = ctx.getResponse<Response>();
        const { statusCode } = response;
        const duration = Date.now() - start;
        const requestId = getRequestId();
        this.logger.log(
          `HTTP ${method} ${url} ${statusCode} ${duration}ms - ${requestId}`,
        );
      }),
    );
  }
}
