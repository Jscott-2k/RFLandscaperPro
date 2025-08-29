import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { JobsService, Job } from './jobs.service';
import { ErrorService } from '../error.service';

@Component({
  selector: 'app-job-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './job-editor.component.html',
})
export class JobEditorComponent implements OnInit {
  private jobsService = inject(JobsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorService = inject(ErrorService);
  private fb = inject(FormBuilder);
  job: Job = { title: '', customerId: 1 };

  form = this.fb.nonNullable.group({
    title: ['', Validators.required.bind(Validators)],
    description: [''],
    scheduledDate: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const jobId = Number(id);
      if (!isNaN(jobId)) {
        this.jobsService.get(jobId).subscribe({
          next: (job) => {
            this.job = job;
            this.form.patchValue(job);
          },
          error: () => this.errorService.show('Failed to load job'),
        });
      }
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: Job = { ...this.job, ...this.form.getRawValue() } as Job;
    if (this.job.id) {
      this.jobsService.update(this.job.id, payload).subscribe({
        next: () => {
          if (typeof window !== 'undefined') {
            window.alert('Job updated successfully');
          }
          void this.router.navigate(['/jobs']);
        },
        error: () => this.errorService.show('Failed to update job'),
      });
    } else {
      this.jobsService.create(payload).subscribe({
        next: () => {
          if (typeof window !== 'undefined') {
            window.alert('Job created successfully');
          }
          void this.router.navigate(['/jobs']);
        },
        error: () => this.errorService.show('Failed to create job'),
      });
    }
  }

  schedule(): void {
    const date = this.form.controls.scheduledDate.value;
    if (this.job.id && date) {
      this.jobsService.schedule(this.job.id, date).subscribe({
        next: (job) => {
          this.job = job;
          this.form.patchValue(job);
          if (typeof window !== 'undefined') {
            window.alert('Job scheduled successfully');
          }
        },
        error: () => this.errorService.show('Failed to schedule job'),
      });
    }
  }

  assign(userId: number, equipmentId: number): void {
    if (this.job.id) {
      this.jobsService.assign(this.job.id, { userId, equipmentId }).subscribe({
        next: (job) => {
          this.job = job;
          if (typeof window !== 'undefined') {
            window.alert('Job assigned successfully');
          }
        },
        error: () => this.errorService.show('Failed to assign job'),
      });
    }
  }
}
