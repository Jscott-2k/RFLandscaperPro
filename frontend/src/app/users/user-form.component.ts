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
        Name:
        <input formControlName="name" />
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
        Roles:
        <input formControlName="roles" />
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
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    roles: ['']
  });

  onSubmit(): void {
    if (this.form.valid) {
      const { name, email, password, roles } = this.form.getRawValue();
      const roleList = roles
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length);
      this.userService
        .createUser({ name, email, password, roles: roleList } as any)
        .subscribe(() => {
          this.router.navigate(['/users']);
        });
    }
  }
}

