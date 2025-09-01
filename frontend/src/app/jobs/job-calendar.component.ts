import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { type Job } from './job.model';
import { JobsService } from './jobs.service';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-job-calendar',
  standalone: true,
  templateUrl: './job-calendar.component.html',
})
export class JobCalendarComponent {
  private jobsService = inject(JobsService);
  selectedDate?: string;
  jobs: Job[] = [];

  loadJobs(): void {
    if (this.selectedDate) {
      this.jobsService.list().subscribe((jobs) => {
        this.jobs = jobs.filter((j) => j.scheduledDate?.startsWith(this.selectedDate!));
      });
    }
  }
}
