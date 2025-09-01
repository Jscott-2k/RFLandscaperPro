import { CommonModule } from '@angular/common';
import { Component, type OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { type Job } from './job.model';
import { JobsService } from './jobs.service';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-job-list',
  standalone: true,
  templateUrl: './job-list.component.html',
})
export class JobListComponent implements OnInit {
  private jobsService = inject(JobsService);
  jobs: Job[] = [];

  ngOnInit(): void {
    this.jobsService.list().subscribe((jobs) => (this.jobs = jobs));
  }
}
