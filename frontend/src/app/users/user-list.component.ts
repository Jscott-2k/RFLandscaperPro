import { CommonModule } from '@angular/common';
import { Component, type OnInit, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { type User } from './user.model';
import { UserService } from './user.service';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-user-list',
  standalone: true,
  template: `
    <h2>Users</h2>
    <ul>
      <li *ngFor="let u of users">
        <a [routerLink]="[u.id]">{{ u.username }}</a>
        <button *ngIf="auth.hasRole('company_admin')" (click)="delete(u.id)">Delete</button>
      </li>
    </ul>
    <button *ngIf="auth.hasRole('company_admin')" (click)="addUser()">Add User</button>
  `,
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  users: User[] = [];

  ngOnInit(): void {
    this.userService.getUsers().subscribe((users) => (this.users = users));
  }

  delete(id: number): void {
    this.userService.deleteUser(id).subscribe(() => {
      this.users = this.users.filter((u) => u.id !== id);
    });
  }

  addUser(): void {
    void this.router.navigate(['/users/new']);
  }
}
