import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { Job, CreateJob, UpdateJob } from './job.model';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private api = inject(ApiService);

  list(): Observable<Job[]> {
    return this.api.getJobs().pipe(map((res) => res.items as Job[]));
  }

  get(id: number): Observable<Job> {
    return this.api.getJob(id);
  }

  create(job: CreateJob): Observable<Job> {
    return this.api.createJob(job);
  }

  update(id: number, job: UpdateJob): Observable<Job> {
    return this.api.updateJob(id, job);
  }

  assign(id: number, payload: { userId: number; equipmentId: number }): Observable<Job> {
    return this.api.assignJob(id, payload);
  }

  schedule(id: number, date: string): Observable<Job> {
    return this.api.scheduleJob(id, date);
  }
}
