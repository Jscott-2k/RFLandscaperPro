import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, Job as ApiJob } from '../api.service';

export interface Job extends Omit<ApiJob, 'id' | 'completed'> {
  id?: number;
  completed?: boolean;
  description?: string;
  scheduledDate?: string;
  customerId?: number;
}

@Injectable({ providedIn: 'root' })
export class JobsService {
  private api = inject(ApiService);

  list(): Observable<Job[]> {
    return this.api.getJobs().pipe(map((res) => res.items as Job[]));
  }

  get(id: number): Observable<Job> {
    return this.api.getJob(id);
  }

  create(job: Job): Observable<Job> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.api.createJob(job as any);
  }

  update(id: number, job: Job): Observable<Job> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.api.updateJob(id, job as any);
  }

  assign(id: number, payload: { userId: number; equipmentId: number }): Observable<Job> {
    return this.api.assignJob(id, payload);
  }

  schedule(id: number, date: string): Observable<Job> {
    return this.api.scheduleJob(id, date);
  }
}
