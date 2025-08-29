import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../auth.service';
import { ErrorService } from '../../error.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input type="text" formControlName="company" placeholder="Company" />
      <input type="email" formControlName="email" placeholder="Email" />
      <input type="password" formControlName="password" placeholder="Password" />
      <button type="submit" [disabled]="loading">Login</button>
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
  private errorService = inject(ErrorService);

  form = this.fb.nonNullable.group({
    company: ['', Validators.required.bind(Validators)],
    email: ['', [Validators.required.bind(Validators), Validators.email.bind(Validators)]],
    password: ['', Validators.required.bind(Validators)],
  });

  loading = false;

  submit(): void {
    if (this.form.valid && !this.loading) {
      this.loading = true;
      this.auth
        .login(this.form.getRawValue())
        .pipe(
          switchMap(() => this.auth.loadCompanies()),
          finalize(() => (this.loading = false)),
        )
        .subscribe({
          next: () => {
            void this.router.navigate(['/dashboard']);
          },
          error: (err: unknown) => this.errorService.show((err as Error).message),
        });
    }
  }
}
