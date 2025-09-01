import { Injectable } from '@angular/core';
import { type Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiService, type Paginated, type PaginationQuery } from '../api.service';

export type Customer = {
  active: boolean;
  email: string;
  id: number;
  name: string;
}

export type CreateCustomer = Partial<Omit<Customer, 'id'>>;
export type UpdateCustomer = Partial<CreateCustomer>;

@Injectable({ providedIn: 'root' })
export class CustomersApiService extends ApiService {
  getCustomers(
    query: PaginationQuery & { active?: boolean; search?: string } = {},
  ): Observable<Paginated<Customer>> {
    return this.request<Paginated<Customer>>('GET', `${environment.apiUrl}/customers`, {
      params: query,
    });
  }

  getCustomer(id: number): Observable<Customer> {
    return this.request<Customer>('GET', `${environment.apiUrl}/customers/${id}`);
  }

  createCustomer(payload: CreateCustomer): Observable<Customer> {
    return this.request<Customer>('POST', `${environment.apiUrl}/customers`, { body: payload });
  }

  updateCustomer(id: number, payload: UpdateCustomer): Observable<Customer> {
    return this.request<Customer>('PATCH', `${environment.apiUrl}/customers/${id}`, {
      body: payload,
    });
  }

  deleteCustomer(id: number): Observable<void> {
    return this.request<void>('DELETE', `${environment.apiUrl}/customers/${id}`);
  }
}
