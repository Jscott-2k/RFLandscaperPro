import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  CustomersApiService,
  type Customer,
  type CreateCustomer,
  type UpdateCustomer,
} from '../api/customers-api.service';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private api = inject(CustomersApiService);

  getCustomers(): Observable<Customer[]> {
    return this.api.getCustomers().pipe(map((res) => res.items));
  }

  getCustomer(id: number): Observable<Customer> {
    return this.api.getCustomer(id);
  }

  createCustomer(customer: CreateCustomer): Observable<Customer> {
    return this.api.createCustomer(customer);
  }

  updateCustomer(id: number, customer: UpdateCustomer): Observable<Customer> {
    return this.api.updateCustomer(id, customer);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.api.deleteCustomer(id);
  }
}
