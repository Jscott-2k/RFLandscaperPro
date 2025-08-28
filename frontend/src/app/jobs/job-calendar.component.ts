import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobsService, Job } from './jobs.service';

@Component({
  selector: 'app-job-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-calendar.component.html'
})
export class JobCalendarComponent {
  private jobsService = inject(JobsService);
  selectedDate?: string;
  jobs: Job[] = [];

  loadJobs(): void {
    if (this.selectedDate) {
      this.jobsService.list().subscribe(jobs => {
        this.jobs = jobs.filter(j => j.scheduledDate?.startsWith(this.selectedDate!));
      });
    }
  }
}
