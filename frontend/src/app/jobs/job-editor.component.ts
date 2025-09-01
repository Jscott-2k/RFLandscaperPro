import { CommonModule } from '@angular/common';
import { Component, type OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

import { ErrorService } from '../error.service';
import { ToasterService } from '../toaster.service';
import { type Job, type CreateJob } from './job.model';
import { JobsService } from './jobs.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  selector: 'app-job-editor',
  standalone: true,
  templateUrl: './job-editor.component.html',
})
export class JobEditorComponent implements OnInit {
  private jobsService = inject(JobsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorService = inject(ErrorService);
  private notifications = inject(ToasterService);
  private fb = inject(FormBuilder);
  job: Partial<Job> = { customerId: 1, title: '', completed: false };

  form = this.fb.nonNullable.group({
    description: [''],
    scheduledDate: [''],
    title: ['', Validators.required.bind(Validators)],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const jobId = Number(id);
      if (!isNaN(jobId)) {
        this.jobsService.get(jobId).subscribe({
          error: () => this.errorService.show('Failed to load job'),
          next: (job) => {
            this.job = job;
            this.form.patchValue(job);
          },
        });
      }
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = { ...this.job, ...this.form.getRawValue() } as CreateJob;
    if (this.job.id) {
      this.jobsService.update(this.job.id, payload).subscribe({
        error: () => this.errorService.show('Failed to update job'),
        next: () => {
          this.notifications.show('Job updated successfully');
          void this.router.navigate(['/jobs']);
        },
      });
    } else {
      this.jobsService.create(payload).subscribe({
        error: () => this.errorService.show('Failed to create job'),
        next: () => {
          this.notifications.show('Job created successfully');
          void this.router.navigate(['/jobs']);
        },
      });
    }
  }

  schedule(): void {
    const date = this.form.controls.scheduledDate.value;
    if (this.job.id && date) {
      this.jobsService.schedule(this.job.id, date).subscribe({
        error: () => this.errorService.show('Failed to schedule job'),
        next: (job) => {
          this.job = job;
          this.form.patchValue(job);
          this.notifications.show('Job scheduled successfully');
        },
      });
    }
  }

  assign(userId: number, equipmentId: number): void {
    if (this.job.id) {
      this.jobsService.assign(this.job.id, { equipmentId, userId }).subscribe({
        error: () => this.errorService.show('Failed to assign job'),
        next: (job) => {
          this.job = job;
          this.notifications.show('Job assigned successfully');
        },
      });
    }
  }
}
