import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from './customer.service';
import { Customer } from './customer.model';

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

  customerId?: number;

  form = this.fb.nonNullable.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    name: ['', Validators.required],
    // eslint-disable-next-line @typescript-eslint/unbound-method
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.customerId = Number(idParam);
      this.customerService
        .getCustomer(this.customerId)
        .subscribe((customer) => this.form.patchValue(customer));
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const action$ = this.customerId
      ? this.customerService.updateCustomer(this.customerId, this.form.value as Customer)
      : this.customerService.createCustomer(this.form.value as Customer);

    action$.subscribe(() => {
      void this.router.navigate(['/customers']);
    });
  }
}
