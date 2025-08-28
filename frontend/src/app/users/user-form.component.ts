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
        <input formControlName="role" />
      </label>
      <label *ngIf="isOwner">
        Company Name:
        <input formControlName="companyName" />
      </label>
      <button type="submit" [disabled]="form.invalid">Save</button>
    </form>
  `
})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    firstName: [''],
    lastName: [''],
    phone: [''],
    role: [''],
    companyName: ['']
  });

  onSubmit(): void {
    if (this.form.valid) {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
        companyName
      } = this.form.getRawValue();
      const payload: any = { username, email, password };
      if (firstName) payload.firstName = firstName;
      if (lastName) payload.lastName = lastName;
      if (phone) payload.phone = phone;
      if (role) payload.role = role;
      if (companyName) payload.companyName = companyName;
      this.userService
        .createUser(payload)
        .subscribe(() => {
          this.router.navigate(['/users']);
        });
    }
  }

  get isOwner(): boolean {
    return this.form.controls.role.value === 'owner';
  }
}

