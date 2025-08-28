import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService } from './customer.service';
import { Customer } from './customer.model';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h2>New Customer</h2>
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
        Phone:
        <input formControlName="phone" />
      </label>
      <button type="submit" [disabled]="form.invalid">Save</button>
    </form>
  `
})
export class CustomerFormComponent {
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['']
  });

  onSubmit(): void {
    if (this.form.valid) {
      this.customerService
        .createCustomer(this.form.value as Customer)
        .subscribe(() => {
          this.router.navigate(['/customers']);
        });
    }
  }
}
