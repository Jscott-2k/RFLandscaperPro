import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorService } from './error.service';
import { HTTP_ERROR_MESSAGES } from './http-error-messages';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const message = HTTP_ERROR_MESSAGES[error.status] ?? 'An unexpected error occurred';
        errorService.show(message);
      }
      return throwError(() => error);
    }),
  );
};
