import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobsService } from './jobs.service';
import { Job } from './job.model';

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
