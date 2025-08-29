import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, Paginated, PaginationQuery } from '../api.service';
import { environment } from '../../environments/environment';

export interface Customer {
  id: number;
  name: string;
  email: string;
  active: boolean;
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
