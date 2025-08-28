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

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  login(data: { email: string; password: string }): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${environment.apiUrl}/auth/login`, data).pipe(
      tap((res) => {
        if (this.hasLocalStorage()) {
          localStorage.setItem('token', res.access_token);
          this.roles.set(this.getRolesFromToken());
        }
      }),
    );
  }

  register(data: {
    username: string;
    email: string;
    password: string;
  }): Observable<{ access_token: string }> {
    return this.http
      .post<{ access_token: string }>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap((res) => {
          if (this.hasLocalStorage()) {
            localStorage.setItem('token', res.access_token);
            this.roles.set(this.getRolesFromToken());
          }
        }),
      );
  }

  logout(): void {
    if (this.hasLocalStorage()) {
      localStorage.removeItem('token');
    }
    this.roles.set([]);
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

  private getRolesFromToken(): string[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (Array.isArray(payload.roles)) {
        return payload.roles;
      }
      if (payload.role) {
        return [payload.role];
      }
      return [];
    } catch {
      return [];
    }
  }
}
