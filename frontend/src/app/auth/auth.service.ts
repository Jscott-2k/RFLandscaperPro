import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly tokenKey = 'access_token';
  private readonly refreshKey = 'refresh_token';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  refreshToken(): Observable<string | null> {
    const refreshToken = localStorage.getItem(this.refreshKey);
    if (!refreshToken) {
      return of(null);
    }
    return this.http
      .post<{ accessToken: string }>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(res => localStorage.setItem(this.tokenKey, res.accessToken)),
        map(res => res.accessToken),
        catchError(() => of(null))
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
  }
}
