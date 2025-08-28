import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Job {
  id?: number;
  title: string;
  description?: string;
  scheduledDate?: string;
  customerId: number;
}

@Injectable({ providedIn: 'root' })
export class JobsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/jobs`;

  list(): Observable<Job[]> {
    return this.http.get<Job[]>(this.baseUrl);
  }

  get(id: number): Observable<Job> {
    return this.http.get<Job>(`${this.baseUrl}/${id}`);
  }

  create(job: Job): Observable<Job> {
    return this.http.post<Job>(this.baseUrl, job);
  }

  update(id: number, job: Job): Observable<Job> {
    return this.http.patch<Job>(`${this.baseUrl}/${id}`, job);
  }

  assign(id: number, payload: { userId: number; equipmentId: number }): Observable<Job> {
    return this.http.post<Job>(`${this.baseUrl}/${id}/assign`, payload);
  }

  schedule(id: number, date: string): Observable<Job> {
    return this.http.post<Job>(`${this.baseUrl}/${id}/schedule`, { scheduledDate: date });
  }
}
