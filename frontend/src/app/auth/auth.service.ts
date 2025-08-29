import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private hasLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
  private readonly roles = signal<string[]>(this.getRolesFromToken());
  private readonly company = signal<string | null>(this.getCompanyFromStorage());
  private readonly companies = signal<string[]>(this.getCompaniesFromStorage());

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  login(data: {
    email: string;
    password: string;
    company: string;
  }): Observable<{ access_token: string; companies?: string[] }> {
    return this.http
      .post<{
        access_token: string;
        companies?: string[];
      }>(`${environment.apiUrl}/auth/login`, data)
      .pipe(
        tap((res) => {
          if (this.hasLocalStorage()) {
            localStorage.setItem('token', res.access_token);
            this.roles.set(this.getRolesFromToken());
            const companies = res.companies ?? [data.company];
            this.setCompany(data.company);
            this.setCompanies(companies);
          }
        }),
      );
  }

  register(data: {
    username: string;
    email: string;
    password: string;
    role?: string;
    company?: { name: string; address?: string; phone?: string; email?: string };
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/register`, data);
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/verify-email`, {
      token,
    });
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/request-password-reset`,
      { email },
    );
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/reset-password`, {
      token,
      password,
    });
  }

  refreshToken(): Observable<{ access_token: string }> {
    return this.http
      .post<{
        access_token: string;
      }>(`${environment.apiUrl}/auth/refresh`, { token: this.getToken() })
      .pipe(
        tap((res) => {
          if (this.hasLocalStorage()) {
            localStorage.setItem('token', res.access_token);
            this.roles.set(this.getRolesFromToken());
          }
        }),
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        if (this.hasLocalStorage()) {
          localStorage.removeItem('token');
          localStorage.removeItem('companyId');
          localStorage.removeItem('companies');
        }
        this.roles.set([]);
        this.company.set(null);
        this.companies.set([]);
      }),
    );
  }

  getToken(): string | null {
    if (!this.hasLocalStorage()) {
      return null;
    }
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCompany(): string | null {
    return this.company();
  }

  getCompanies(): string[] {
    return this.companies();
  }

  setCompany(company: string): void {
    if (this.hasLocalStorage()) {
      localStorage.setItem('companyId', company);
    }
    this.company.set(company);
  }

  private setCompanies(companies: string[]): void {
    if (this.hasLocalStorage()) {
      localStorage.setItem('companies', JSON.stringify(companies));
    }
    this.companies.set(companies);
  }

  private getCompanyFromStorage(): string | null {
    if (!this.hasLocalStorage()) {
      return null;
    }
    return localStorage.getItem('companyId');
  }

  private getCompaniesFromStorage(): string[] {
    if (!this.hasLocalStorage()) {
      return [];
    }
    const raw = localStorage.getItem('companies');
    try {
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private getRolesFromToken(): string[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }
    try {
      const payloadStr = atob(token.split('.')[1]);
      const payload: unknown = JSON.parse(payloadStr);
      if (
        payload &&
        typeof payload === 'object' &&
        'roles' in payload &&
        Array.isArray((payload as { roles: unknown }).roles)
      ) {
        return (payload as { roles: string[] }).roles;
      }
      if (
        payload &&
        typeof payload === 'object' &&
        'role' in payload &&
        typeof (payload as { role: unknown }).role === 'string'
      ) {
        return [(payload as { role: string }).role];
      }
      return [];
    } catch {
      return [];
    }
  }
}
