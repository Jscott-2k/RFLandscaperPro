import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth/auth.service';

export const companyInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const company = auth.getCompany();
  if (company) {
    req = req.clone({ setHeaders: { 'X-Company': company } });
  }
  return next(req);
};
