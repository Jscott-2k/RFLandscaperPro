import { Injectable } from '@angular/core';
import { type Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiService, type Paginated, type PaginationQuery } from '../api.service';
import { type UpcomingJobSummary } from '../models/dashboard.models';

export type Job = {
  completed: boolean;
  id: number;
  title: string;
}

export type CreateJob = Partial<Omit<Job, 'id'>>;
export type UpdateJob = Partial<CreateJob>;

@Injectable({ providedIn: 'root' })
export class JobsApiService extends ApiService {
  getJobs(
    query: PaginationQuery & {
      completed?: boolean;
      customerId?: number;
      startDate?: string;
      endDate?: string;
      workerId?: number;
      equipmentId?: number;
    } = {},
  ): Observable<Paginated<Job>> {
    return this.request<Paginated<Job>>('GET', `${environment.apiUrl}/jobs`, {
      params: query,
    });
  }

  getJob(id: number): Observable<Job> {
    return this.request<Job>('GET', `${environment.apiUrl}/jobs/${id}`);
  }

  createJob(payload: CreateJob): Observable<Job> {
    return this.request<Job>('POST', `${environment.apiUrl}/jobs`, { body: payload });
  }

  updateJob(id: number, payload: UpdateJob): Observable<Job> {
    return this.request<Job>('PATCH', `${environment.apiUrl}/jobs/${id}`, { body: payload });
  }

  assignJob(id: number, payload: { userId: number; equipmentId: number }): Observable<Job> {
    return this.request<Job>('POST', `${environment.apiUrl}/jobs/${id}/assign`, {
      body: payload,
    });
  }

  scheduleJob(id: number, date: string): Observable<Job> {
    return this.request<Job>('POST', `${environment.apiUrl}/jobs/${id}/schedule`, {
      body: { scheduledDate: date },
    });
  }

  deleteJob(id: number): Observable<void> {
    return this.request<void>('DELETE', `${environment.apiUrl}/jobs/${id}`);
  }

  getUpcomingJobs(): Observable<{ items: UpcomingJobSummary[]; total: number }> {
    return this.request<{ items: UpcomingJobSummary[]; total: number }>(
      'GET',
      `${environment.apiUrl}/jobs`,
      {
        params: { completed: false, limit: 5 },
      },
    );
  }
}
