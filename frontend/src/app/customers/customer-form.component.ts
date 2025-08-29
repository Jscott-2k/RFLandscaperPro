import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from './customer.service';
import { Customer } from './customer.model';
import { ErrorService } from '../error.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  private notifications = inject(NotificationService);

  customerId?: number;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required.bind(Validators)],
    email: ['', [Validators.required.bind(Validators), Validators.email.bind(Validators)]],
    phone: [''],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.customerId = Number(idParam);
      this.customerService.getCustomer(this.customerId).subscribe({
        next: (customer) => this.form.patchValue(customer),
        error: () => this.errorService.show('Failed to load customer'),
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
      next: () => {
        this.notifications.show('Customer saved successfully');
        void this.router.navigate(['/customers']);
      },
      error: () => this.errorService.show('Failed to save customer'),
    });
  }
}
