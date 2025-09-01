import { type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from './auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const company = auth.getCompany();

  const isLogin = req.url.includes('/auth/login');
  const isSwitchCompany = req.url.includes('/auth/switch-company');

  const headers: Record<string, string> = {};

  if (token && !isLogin) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (company !== null && !isLogin && !isSwitchCompany) {
    headers['X-Company-ID'] = String(company);
  }

  if (Object.keys(headers).length) {
    req = req.clone({ setHeaders: headers });
  }

  return next(req);
};
