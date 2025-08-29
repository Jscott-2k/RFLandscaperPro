import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input type="text" formControlName="username" placeholder="Username" />
      <input type="email" formControlName="email" placeholder="Email" />
      <input type="password" formControlName="password" placeholder="Password" />
      <label>
        Role:
        <select formControlName="role">
          <option value="customer">Customer</option>
          <option value="owner">Owner</option>
          <option value="worker">Worker</option>
        </select>
      </label>
      <div formGroupName="company" *ngIf="isOwner">
        <input type="text" formControlName="name" placeholder="Company Name" />
        <input type="text" formControlName="address" placeholder="Address" />
        <input type="text" formControlName="phone" placeholder="Phone" />
        <input type="email" formControlName="email" placeholder="Email" />
      </div>
      <button type="submit">Register</button>
    </form>
  `
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: ['customer', Validators.required],
    company: this.fb.nonNullable.group({
      name: [''],
      address: [''],
      phone: [''],
      email: [''],
    }),
  });

  get isOwner(): boolean {
    return this.form.controls.role.value === 'owner';
  }

  submit(): void {
    if (this.form.valid) {
      const { username, email, password, role, company } = this.form.getRawValue();
      const payload: any = { username, email, password, role };
      if (this.isOwner) {
        payload.company = company;
      }
      this.auth.register(payload).subscribe(() => {
        this.router.navigate(['/login']);
      });
    }
  }
}
