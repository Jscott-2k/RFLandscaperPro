import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input type="text" formControlName="company" placeholder="Company" />
      <input type="email" formControlName="email" placeholder="Email" />
      <input type="password" formControlName="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
    <p>
      <small><a routerLink="/register">Create account</a></small>
    </p>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    // Validators methods are static and do not rely on `this`.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    company: ['', Validators.required],
    // eslint-disable-next-line @typescript-eslint/unbound-method
    email: ['', [Validators.required, Validators.email]],
    // eslint-disable-next-line @typescript-eslint/unbound-method
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.valid) {
      this.auth.login(this.form.getRawValue()).subscribe(() => {
        void this.router.navigate(['/dashboard']);
      });
    }
  }
}
