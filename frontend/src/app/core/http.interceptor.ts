import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ErrorService } from './error.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const errorService = inject(ErrorService);

  const token = authService.getToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap(newToken => {
            if (newToken) {
              const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(retryReq);
            }
            authService.logout();
            router.navigate(['/auth']);
            errorService.notify('Session expired. Please log in again.');
            return throwError(() => error);
          }),
          catchError(err => {
            authService.logout();
            router.navigate(['/auth']);
            errorService.notify('Session expired. Please log in again.');
            return throwError(() => err);
          })
        );
      }

      if (error.status === 403) {
        router.navigate(['/auth']);
      }

      errorService.notify(error.message);
      return throwError(() => error);
    })
  );
};
