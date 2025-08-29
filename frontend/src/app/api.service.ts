import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from './error.service';

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  private handleError = (error: HttpErrorResponse) => {
    const message =
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error &&
      typeof (error.error as { message?: unknown }).message === 'string'
        ? (error.error as { message: string }).message
        : 'An unexpected error occurred. Please try again later.';
    this.errorService.show(message);
    return throwError(() => new Error(message));
  };

  private toHttpParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const stringValue =
            typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
              ? String(value)
              : JSON.stringify(value);
          httpParams = httpParams.set(key, stringValue);
        }
      });
    }
    return httpParams;
  }

  protected request<T>(
    method: string,
    url: string,
    options: { params?: Record<string, unknown>; body?: unknown } = {},
  ): Observable<T> {
    return this.http
      .request<T>(method, url, {
        body: options.body,
        params: this.toHttpParams(options.params),
      })
      .pipe(catchError(this.handleError));
  }

  getHealth(): Observable<{ status: string }> {
    return this.request<{ status: string }>('GET', `${environment.apiUrl}/health`);
  }
}
