import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { JobsService, Job } from './jobs.service';

@Component({
  selector: 'app-job-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './job-editor.component.html'
})
export class JobEditorComponent implements OnInit {
  private jobsService = inject(JobsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  job: Job = { title: '', customerId: 1 };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const jobId = Number(id);
      if (!isNaN(jobId)) {
        this.jobsService.get(jobId).subscribe(job => (this.job = job));
      }
    }
  }

  save(): void {
    if (this.job.id) {
      this.jobsService.update(this.job.id, this.job).subscribe(() => this.router.navigate(['/jobs']));
    } else {
      this.jobsService.create(this.job).subscribe(() => this.router.navigate(['/jobs']));
    }
  }

  schedule(): void {
    if (this.job.id && this.job.scheduledDate) {
      this.jobsService.schedule(this.job.id, this.job.scheduledDate).subscribe(job => (this.job = job));
    }
  }

  assign(userId: number, equipmentId: number): void {
    if (this.job.id) {
      this.jobsService.assign(this.job.id, { userId, equipmentId }).subscribe(job => (this.job = job));
    }
  }
}
