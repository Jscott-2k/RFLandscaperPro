import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ErrorService } from '../../error.service';
import { AuthService } from '../auth.service';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-signup-owner',
  standalone: true,
  template: `
    <p>
      <small>Company details are required to create a company owner account.</small>
    </p>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input type="text" formControlName="name" placeholder="Username" />
      <input type="text" formControlName="firstName" placeholder="First Name" />
      <input type="text" formControlName="lastName" placeholder="Last Name" />
      <input type="tel" formControlName="phone" placeholder="Phone" />
      <input type="email" formControlName="email" placeholder="Email" />
      <input
        type="password"
        formControlName="password"
        placeholder="Password (8+ chars, upper & lower case, number, special)"
      />
      <input type="text" formControlName="companyName" placeholder="Company Name" />
      <button type="submit" [disabled]="loading">Sign Up</button>
    </form>
  `,
})
export class SignupOwnerComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private errorService = inject(ErrorService);

  form = this.fb.nonNullable.group({
    companyName: ['', Validators.required.bind(Validators)],
    email: ['', [Validators.required.bind(Validators), Validators.email.bind(Validators)]],
    name: ['', Validators.required.bind(Validators)],
    firstName: [''],
    lastName: [''],
    phone: [''],
    password: [
      '',
      [
        Validators.required.bind(Validators),
        Validators.minLength(8).bind(Validators),
        Validators.pattern(PASSWORD_REGEX).bind(Validators),
      ],
    ],
  });

  loading = false;

  submit(): void {
    if (this.form.valid && !this.loading) {
      this.loading = true;
      this.auth
        .signupOwner(this.form.getRawValue())
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          error: (err: unknown) => {
            const status = (err as { status?: number }).status;
            const message = status === 409 ? 'Email already exists' : (err as Error).message;
            this.errorService.show(message);
          },
          next: () => void this.router.navigate(['/dashboard']),
        });
    }
  }
}
