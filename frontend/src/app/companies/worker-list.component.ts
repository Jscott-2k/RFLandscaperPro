import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CompanyService } from './company.service';
import { UserService } from '../users/user.service';
import { User } from '../users/user.model';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-worker-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h2>Workers</h2>
    <ul>
      <li *ngFor="let w of workers">
        <a [routerLink]="['/users', w.id]">{{ w.username }}</a>
        <button *ngIf="auth.hasRole('company_admin')" (click)="delete(w.id)">Delete</button>
      </li>
    </ul>
    <button *ngIf="auth.hasRole('company_admin')" (click)="addWorker()">Add Worker</button>
  `,
})
export class WorkerListComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  workers: User[] = [];

  ngOnInit(): void {
    this.companyService.getWorkers().subscribe((ws) => (this.workers = ws));
  }

  delete(id: number): void {
    this.userService.deleteUser(id).subscribe(() => {
      this.workers = this.workers.filter((w) => w.id !== id);
    });
  }

  addWorker(): void {
    void this.router.navigate(['/users/new']);
  }
}
