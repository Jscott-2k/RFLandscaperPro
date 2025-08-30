import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CompanyMembership, CompanyUserRole } from '@rflp/shared';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private hasLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
  private readonly roles = signal<string[]>(this.getRolesFromToken());
  private readonly company = signal<number | null>(this.getCompanyFromStorage());
  private readonly companies = signal<CompanyMembership[]>(this.getCompaniesFromStorage());

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  login(data: { email: string; password: string }): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${environment.apiUrl}/auth/login`, data).pipe(
      tap((res) => {
        if (this.hasLocalStorage()) {
          localStorage.setItem('token', res.access_token);
          this.roles.set(this.getRolesFromToken(res.access_token));
          const company = this.getCompanyFromToken(res.access_token);
          this.setCompany(company ?? null);
          this.setCompanies([]);
        }
      }),
    );
  }

  loadCompanies(): Observable<CompanyMembership[]> {
    return this.http
      .get<CompanyMembership[]>(`${environment.apiUrl}/me/companies`)
      .pipe(tap((companies) => this.setCompanies(companies)));
  }

  switchCompany(companyId: number): Observable<{ access_token: string }> {
    return this.http
      .post<{ access_token: string }>(`${environment.apiUrl}/auth/switch-company`, { companyId })
      .pipe(
        tap((res) => {
          if (this.hasLocalStorage()) {
            localStorage.setItem('token', res.access_token);
            this.roles.set(this.getRolesFromToken(res.access_token));
            this.setCompany(companyId);
          }
        }),
      );
  }

  signupOwner(data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }): Observable<{ access_token: string }> {
    return this.http
      .post<{ access_token: string }>(`${environment.apiUrl}/auth/signup-owner`, data)
      .pipe(tap((res) => this.handleAuth(res)));
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
      .pipe(tap((res) => this.handleAuth(res)));
  }

  handleAuth(
    res: { access_token: string; companies?: CompanyMembership[] },
    companyHint?: number,
  ): void {
    if (this.hasLocalStorage()) {
      localStorage.setItem('token', res.access_token);
      this.roles.set(this.getRolesFromToken(res.access_token));
      const company = this.getCompanyFromToken(res.access_token) ?? companyHint ?? null;
      const companies =
        res.companies ??
        (company ? [{ companyId: company, companyName: '', role: CompanyUserRole.WORKER }] : []);
      this.setCompany(company);
      this.setCompanies(companies);
    }
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

  getCompany(): number | null {
    return this.company();
  }

  getCompanies(): CompanyMembership[] {
    return this.companies();
  }

  setCompany(company: number | null): void {
    if (this.hasLocalStorage()) {
      if (company !== null) {
        localStorage.setItem('companyId', String(company));
      } else {
        localStorage.removeItem('companyId');
      }
    }
    this.company.set(company);
  }

  private setCompanies(companies: CompanyMembership[]): void {
    if (this.hasLocalStorage()) {
      localStorage.setItem('companies', JSON.stringify(companies));
    }
    this.companies.set(companies);
  }

  private getCompanyFromStorage(): number | null {
    if (!this.hasLocalStorage()) {
      return null;
    }
    const stored = localStorage.getItem('companyId');
    if (stored) {
      const parsed = Number(stored);
      return Number.isNaN(parsed) ? null : parsed;
    }
    const token = localStorage.getItem('token');
    if (token) {
      const company = this.getCompanyFromToken(token);
      if (company !== null) {
        localStorage.setItem('companyId', String(company));
        return company;
      }
    }
    return null;
  }

  private getCompaniesFromStorage(): CompanyMembership[] {
    if (!this.hasLocalStorage()) {
      return [];
    }
    const raw = localStorage.getItem('companies');
    try {
      return raw ? (JSON.parse(raw) as CompanyMembership[]) : [];
    } catch {
      return [];
    }
  }

  private decodeTokenPayload(token?: string): Record<string, unknown> | null {
    const t = token ?? this.getToken();
    if (!t) {
      return null;
    }
    try {
      const payloadStr = atob(t.split('.')[1]);
      const payload: unknown = JSON.parse(payloadStr);
      return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  private getRolesFromToken(token?: string): string[] {
    const payload: unknown = this.decodeTokenPayload(token);
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
  }

  private getCompanyFromToken(token?: string): number | null {
    const payload: unknown = this.decodeTokenPayload(token);
    if (
      payload &&
      typeof payload === 'object' &&
      'companyId' in payload &&
      typeof (payload as { companyId: unknown }).companyId !== 'undefined'
    ) {
      const raw = (payload as { companyId: unknown }).companyId;
      const num = typeof raw === 'string' ? Number(raw) : (raw as number);
      return Number.isNaN(num) ? null : num;
    }
    return null;
  }
}
