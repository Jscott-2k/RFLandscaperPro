import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  getHealth(): Observable<unknown> {
    return this.http.get(`${environment.apiUrl}/health`);
  }

  getUpcomingJobs(): Observable<{ items: unknown[]; total: number }> {
    return this.http.get<{ items: unknown[]; total: number }>(
      `${environment.apiUrl}/jobs?completed=false&limit=5`
    );
  }

  getEquipmentCount(status: string): Observable<{ items: unknown[]; total: number }> {
    return this.http.get<{ items: unknown[]; total: number }>(
      `${environment.apiUrl}/equipment?status=${status}&limit=1`
    );
  }

  getUsers(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${environment.apiUrl}/users`);
  }
}
