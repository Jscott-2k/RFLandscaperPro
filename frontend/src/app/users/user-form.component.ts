import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ErrorService } from '../error.service';
import { ToasterService } from '../toaster.service';
import { UserService } from './user.service';
import { type CreateUser } from './user.model';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-user-form',
  standalone: true,
  template: `
    <h2>New User</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>
        Username:
        <input formControlName="username" />
      </label>
      <label>
        Email:
        <input formControlName="email" />
      </label>
      <label>
        Password:
        <input type="password" formControlName="password" />
      </label>
      <label>
        First Name:
        <input formControlName="firstName" />
      </label>
      <label>
        Last Name:
        <input formControlName="lastName" />
      </label>
      <label>
        Phone:
        <input formControlName="phone" />
      </label>
      <label>
        Role:
        <select formControlName="role">
          <option value="customer">Customer</option>
          <option value="company_owner">Company Owner</option>
          <option value="worker">Worker</option>
        </select>
      </label>
      <div formGroupName="company" *ngIf="isOwner">
        <label>
          Company Name:
          <input formControlName="name" />
        </label>
        <label>
          Address:
          <input formControlName="address" />
        </label>
        <label>
          Phone:
          <input formControlName="phone" />
        </label>
        <label>
          Email:
          <input formControlName="email" />
        </label>
      </div>
      <button type="submit" [disabled]="form.invalid">Save</button>
    </form>
  `,
})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private errorService = inject(ErrorService);
  private notifications = inject(ToasterService);

   
  form = this.fb.nonNullable.group({
    company: this.fb.nonNullable.group({
      address: [''],
      email: [''],
      name: [''],
      phone: [''],
    }),
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: [''],
    password: ['', Validators.required],
    phone: [''],
    role: ['customer'],
    username: ['', Validators.required],
  });
   

  onSubmit(): void {
    if (this.form.valid) {
    const { company, email, firstName, lastName, password, phone, role, username } =
      this.form.getRawValue();
    const payload: CreateUser = {
      email,
      password,
      username,
    };
    if (firstName) payload.firstName = firstName;
    if (lastName) payload.lastName = lastName;
    if (phone) payload.phone = phone;
    if (role) payload.role = role;
    if (this.isOwner) payload.company = company;
    this.userService.createUser(payload).subscribe({
      error: () => this.errorService.show('Failed to create user'),
      next: () => {
        this.notifications.show('User created successfully');
        void this.router.navigate(['/users']);
      },
      });
    }
  }

  get isOwner(): boolean {
    return this.form.controls.role.value === 'company_owner';
  }
}
