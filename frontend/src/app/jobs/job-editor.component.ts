import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { JobsService, Job } from './jobs.service';
import { ErrorService } from '../error.service';

@Component({
  selector: 'app-job-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './job-editor.component.html',
})
export class JobEditorComponent implements OnInit {
  private jobsService = inject(JobsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorService = inject(ErrorService);

  job: Job = { title: '', customerId: 1 };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const jobId = Number(id);
      if (!isNaN(jobId)) {
        this.jobsService.get(jobId).subscribe({
          next: (job) => (this.job = job),
          error: () => this.errorService.show('Failed to load job'),
        });
      }
    }
  }

  save(): void {
    if (this.job.id) {
      this.jobsService.update(this.job.id, this.job).subscribe({
        next: () => {
          if (typeof window !== 'undefined') {
            window.alert('Job updated successfully');
          }
          void this.router.navigate(['/jobs']);
        },
        error: () => this.errorService.show('Failed to update job'),
      });
    } else {
      this.jobsService.create(this.job).subscribe({
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
    if (this.job.id && this.job.scheduledDate) {
      this.jobsService.schedule(this.job.id, this.job.scheduledDate).subscribe({
        next: (job) => {
          this.job = job;
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
