import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UserService, User } from './user.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="user">
      <h3>{{ user.name }}</h3>
      <form (ngSubmit)="save()">
        <label>Name:
          <input name="name" [(ngModel)]="user.name" />
        </label>
        <label>Email:
          <input name="email" [(ngModel)]="user.email" />
        </label>
        <div *ngIf="auth.hasRole('admin')">
          <label>Roles:
            <input name="roles" [(ngModel)]="rolesText" />
          </label>
        </div>
        <button type="submit">Save</button>
      </form>
    </div>
  `
})
export class UserDetailComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);
  user?: User;
  rolesText = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userService.getUser(id).subscribe(u => {
      this.user = u;
      this.rolesText = u.roles.join(', ');
    });
  }

  save(): void {
    if (!this.user) {
      return;
    }
    if (this.auth.hasRole('admin')) {
      this.user.roles = this.rolesText
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length);
    }
    this.userService.updateUser(this.user).subscribe();
  }
}
