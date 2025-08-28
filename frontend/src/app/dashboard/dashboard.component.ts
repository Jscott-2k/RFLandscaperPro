import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dashboard">
      <a routerLink="/jobs" class="widget">
        <h3>Upcoming Jobs</h3>
        <p>{{ upcomingJobs() }}</p>
      </a>
      <a routerLink="/equipment" class="widget">
        <h3>Equipment Status</h3>
        <p>Available: {{ equipmentAvailable() }}</p>
        <p>In Use: {{ equipmentInUse() }}</p>
      </a>
      <a routerLink="/users" class="widget">
        <h3>Active Users</h3>
        <p>{{ activeUsers() }}</p>
      </a>
    </div>
  `,
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly upcomingJobs = signal(0);
  protected readonly equipmentAvailable = signal(0);
  protected readonly equipmentInUse = signal(0);
  protected readonly activeUsers = signal(0);

  ngOnInit(): void {
    this.api.getUpcomingJobs().subscribe(data => this.upcomingJobs.set(data.total));
    this.api.getEquipmentCount('available').subscribe(data => this.equipmentAvailable.set(data.total));
    this.api.getEquipmentCount('in_use').subscribe(data => this.equipmentInUse.set(data.total));
    this.api.getUsers().subscribe(data => this.activeUsers.set(data.length));
  }
}
