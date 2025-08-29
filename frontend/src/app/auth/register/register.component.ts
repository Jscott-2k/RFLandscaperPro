import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth.service';
import { ErrorService } from '../../error.service';

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
      <button type="submit" [disabled]="loading">Register</button>
    </form>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private errorService = inject(ErrorService);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required.bind(Validators)],
    email: ['', [Validators.required.bind(Validators), Validators.email.bind(Validators)]],
    password: ['', Validators.required.bind(Validators)],
    role: ['customer', Validators.required.bind(Validators)],
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

  loading = false;

  submit(): void {
    if (this.form.valid && !this.loading) {
      const { username, email, password, role, company } = this.form.getRawValue();
      const payload: Parameters<AuthService['register']>[0] = {
        username,
        email,
        password,
        role,
      };
      if (this.isOwner) {
        payload.company = company;
      }
      this.loading = true;
      this.auth
        .register(payload)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: () => {
            void this.router.navigate(['/login']);
          },
          error: (err: unknown) => this.errorService.show((err as Error).message),
        });
    }
  }
}
