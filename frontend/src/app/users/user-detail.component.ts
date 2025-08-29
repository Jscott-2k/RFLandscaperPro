import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UserService, User } from './user.service';
import { AuthService } from '../auth/auth.service';
import { ErrorService } from '../error.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="user">
      <h3>{{ user.username }}</h3>
      <form (ngSubmit)="save()">
        <label
          >Username:
          <input name="username" [(ngModel)]="user.username" />
        </label>
        <label
          >Email:
          <input name="email" [(ngModel)]="user.email" />
        </label>
        <label
          >First Name:
          <input name="firstName" [(ngModel)]="user.firstName" />
        </label>
        <label
          >Last Name:
          <input name="lastName" [(ngModel)]="user.lastName" />
        </label>
        <label
          >Phone:
          <input name="phone" [(ngModel)]="user.phone" />
        </label>
        <div *ngIf="auth.hasRole('admin')">
          <label
            >Role:
            <input name="role" [(ngModel)]="user.role" />
          </label>
        </div>
        <button type="submit">Save</button>
      </form>
    </div>
  `,
})
export class UserDetailComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);
  private readonly errorService = inject(ErrorService);
  user?: User;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userService.getUser(id).subscribe({
      next: (u) => {
        this.user = u;
      },
      error: () => this.errorService.show('Failed to load user'),
    });
  }

  save(): void {
    if (!this.user) {
      return;
    }
    this.userService.updateUser(this.user).subscribe({
      next: () => {
        if (typeof window !== 'undefined') {
          window.alert('User updated successfully');
        }
      },
      error: () => this.errorService.show('Failed to save user'),
    });
  }
}
