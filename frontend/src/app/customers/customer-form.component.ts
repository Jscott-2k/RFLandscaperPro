import { CommonModule } from '@angular/common';
import { Component, inject, type OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ErrorService } from '../error.service';
import { ToasterService } from '../toaster.service';
import { type Customer } from './customer.model';
import { CustomerService } from './customer.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-customer-form',
  standalone: true,
  template: `
    <h2>{{ customerId ? 'Edit Customer' : 'New Customer' }}</h2>
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
  `,
})
export class CustomerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorService = inject(ErrorService);
  private notifications = inject(ToasterService);

  customerId?: number;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required.bind(Validators), Validators.email.bind(Validators)]],
    name: ['', Validators.required.bind(Validators)],
    phone: [''],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.customerId = Number(idParam);
      this.customerService.getCustomer(this.customerId).subscribe({
        error: () => this.errorService.show('Failed to load customer'),
        next: (customer) => this.form.patchValue(customer),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const action$ = this.customerId
      ? this.customerService.updateCustomer(this.customerId, this.form.value as Customer)
      : this.customerService.createCustomer(this.form.value as Customer);

    action$.subscribe({
      error: () => this.errorService.show('Failed to save customer'),
      next: () => {
        this.notifications.show('Customer saved successfully');
        void this.router.navigate(['/customers']);
      },
    });
  }
}
