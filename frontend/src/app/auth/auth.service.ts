
import { Injectable, signal,inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly roles = signal<string[]>(['admin']);

  hasRole(role: string): boolean {
    return this.roles().includes(role);

  login(data: { email: string; password: string }): Observable<{ access_token: string }> {
    return this.http
      .post<{ access_token: string }>(`${environment.apiUrl}/auth/login`, data)
      .pipe(tap(res => localStorage.setItem('token', res.access_token)));
  }

  register(data: { name?: string; email: string; password: string }): Observable<{ access_token: string }> {
    return this.http
      .post<{ access_token: string }>(`${environment.apiUrl}/auth/register`, data)
      .pipe(tap(res => localStorage.setItem('token', res.access_token)));
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();

  }
}