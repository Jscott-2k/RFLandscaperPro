import { CommonModule } from '@angular/common';
import { Component, type OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { ErrorService } from '../error.service';
import { ToasterService } from '../toaster.service';
import { type User } from './user.model';
import { UserService } from './user.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-user-detail',
  standalone: true,
  template: `
    <div *ngIf="user">
      <h3>{{ form.controls.username.value }}</h3>
      <form [formGroup]="form" (ngSubmit)="save()">
        <label>
          Username:
          <input formControlName="username" />
        </label>
        <div
          *ngIf="
            form.controls.username.errors &&
            (form.controls.username.dirty || form.controls.username.touched)
          "
        >
          {{ form.controls.username.errors | json }}
        </div>
        <label>
          Email:
          <input formControlName="email" />
        </label>
        <div
          *ngIf="
            form.controls.email.errors && (form.controls.email.dirty || form.controls.email.touched)
          "
        >
          {{ form.controls.email.errors | json }}
        </div>
        <label>
          First Name:
          <input formControlName="firstName" />
        </label>
        <div
          *ngIf="
            form.controls.firstName.errors &&
            (form.controls.firstName.dirty || form.controls.firstName.touched)
          "
        >
          {{ form.controls.firstName.errors | json }}
        </div>
        <label>
          Last Name:
          <input formControlName="lastName" />
        </label>
        <div
          *ngIf="
            form.controls.lastName.errors &&
            (form.controls.lastName.dirty || form.controls.lastName.touched)
          "
        >
          {{ form.controls.lastName.errors | json }}
        </div>
        <label>
          Phone:
          <input formControlName="phone" />
        </label>
        <div
          *ngIf="
            form.controls.phone.errors && (form.controls.phone.dirty || form.controls.phone.touched)
          "
        >
          {{ form.controls.phone.errors | json }}
        </div>
        <div *ngIf="auth.hasRole('company_admin')">
          <label>
            Role:
            <input formControlName="role" />
          </label>
          <div
            *ngIf="
              form.controls.role.errors && (form.controls.role.dirty || form.controls.role.touched)
            "
          >
            {{ form.controls.role.errors | json }}
          </div>
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
  private readonly notifications = inject(ToasterService);
  private fb = inject(FormBuilder);
  user?: User;

   
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    role: [''],
    username: ['', Validators.required],
  });
   

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userService.getUser(id).subscribe({
      error: () => this.errorService.show('Failed to load user'),
      next: (u) => {
        this.user = u;
        this.form.patchValue(u);
      },
    });
  }

  save(): void {
    if (!this.user) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { role, ...data } = { ...this.user, ...this.form.getRawValue() } as User & {
      role?: string;
    };
    this.userService.updateUser({ ...data, id: this.user.id }).subscribe({
      error: () => this.errorService.show('Failed to save user'),
      next: () => {
        this.notifications.show('User updated successfully');
      },
    });
  }
}
