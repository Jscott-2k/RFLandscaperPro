import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobsService, Job } from './jobs.service';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-list.component.html',
})
export class JobListComponent implements OnInit {
  private jobsService = inject(JobsService);
  jobs: Job[] = [];

  ngOnInit(): void {
    this.jobsService.list().subscribe((jobs) => (this.jobs = jobs));
  }
}
