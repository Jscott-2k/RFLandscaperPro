import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Customer } from './customer.model';
import { ApiService } from '../api.service';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private api = inject(ApiService);

  getCustomers(): Observable<Customer[]> {
    return this.api.getCustomers().pipe(map((res) => res.items));
  }

  getCustomer(id: number): Observable<Customer> {
    return this.api.getCustomer(id);
  }

  createCustomer(customer: Partial<Customer>): Observable<Customer> {
    return this.api.createCustomer(customer);
  }

  updateCustomer(id: number, customer: Partial<Customer>): Observable<Customer> {
    return this.api.updateCustomer(id, customer);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.api.deleteCustomer(id);
  }
}
