import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
          <option value="owner">Owner</option>
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

  form = this.fb.nonNullable.group({
    username: ['', Validators.required.bind(Validators)],
    email: ['', [Validators.required.bind(Validators), Validators.email.bind(Validators)]],
    password: ['', Validators.required.bind(Validators)],
    firstName: [''],
    lastName: [''],
    phone: [''],
    role: ['customer'],
    company: this.fb.nonNullable.group({
      name: [''],
      address: [''],
      phone: [''],
      email: [''],
    }),
  });

  onSubmit(): void {
    if (this.form.valid) {
      const { username, email, password, firstName, lastName, phone, role, company } =
        this.form.getRawValue();
      const payload: Parameters<UserService['createUser']>[0] & { password: string } = {
        username,
        email,
        password,
      };
      if (firstName) payload.firstName = firstName;
      if (lastName) payload.lastName = lastName;
      if (phone) payload.phone = phone;
      if (role) payload.role = role;
      if (this.isOwner) payload.company = company;
      this.userService.createUser(payload).subscribe(() => {
        void this.router.navigate(['/users']);
      });
    }
  }

  get isOwner(): boolean {
    return this.form.controls.role.value === 'owner';
  }
}
