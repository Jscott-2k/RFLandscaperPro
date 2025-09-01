import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ErrorService } from '../../error.service';
import { AuthService } from '../auth.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  standalone: true,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input type="email" formControlName="email" placeholder="Email" />
      <input type="password" formControlName="password" placeholder="Password" />
      <button type="submit" [disabled]="loading">Login</button>
    </form>
    <p>
      <small>
        Company owners can
        <a routerLink="/signup/company">create an account</a>.
      </small>
    </p>
    <p>
      <small>Customers and workers need an invitation to join.</small>
    </p>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private errorService = inject(ErrorService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required.bind(Validators), Validators.email.bind(Validators)]],
    password: ['', Validators.required.bind(Validators)],
  });

  loading = false;

  submit(): void {
    if (this.form.valid && !this.loading) {
      this.loading = true;
      this.auth
        .login(this.form.getRawValue())
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          error: (err: unknown) => this.errorService.show((err as Error).message),
          next: () => {
            void this.router.navigate(['/dashboard']);
          },
        });
    }
  }
}
