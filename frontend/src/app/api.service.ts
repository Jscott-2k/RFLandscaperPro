import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from './error.service';

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export type CreateCustomer = Partial<Omit<Customer, 'id'>>;
export type UpdateCustomer = Partial<CreateCustomer>;

export interface Equipment {
  id: number;
  name: string;
  status: string;
  type: string;
}

export type CreateEquipment = Partial<Omit<Equipment, 'id'>>;
export type UpdateEquipment = Partial<CreateEquipment>;

export interface Job {
  id: number;
  title: string;
  completed: boolean;
}

export type CreateJob = Partial<Omit<Job, 'id'>>;
export type UpdateJob = Partial<CreateJob>;

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: {
    name: string;
    address?: string;
    phone?: string;
  };
}

export type CreateUser = Partial<Omit<User, 'id'>>;
export type UpdateUser = Partial<CreateUser>;

export interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  ownerId?: number;
}

export type CreateCompany = Partial<Omit<Company, 'id'>>;
export type UpdateCompany = Partial<CreateCompany>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  private handleError = (error: HttpErrorResponse) => {
    const message = error.error?.message || 'An unexpected error occurred. Please try again later.';
    this.errorService.show(message);
    return throwError(() => new Error(message));
  };

  private toHttpParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return httpParams;
  }

  getHealth(): Observable<{ status: string }> {
    return this.http
      .get<{ status: string }>(`${environment.apiUrl}/health`)
      .pipe(catchError(this.handleError));
  }

  // Customers
  getCustomers(query: PaginationQuery & { active?: boolean; search?: string } = {}): Observable<
    Paginated<Customer>
  > {
    return this.http
      .get<Paginated<Customer>>(`${environment.apiUrl}/customers`, {
        params: this.toHttpParams(query),
      })
      .pipe(catchError(this.handleError));
  }

  getCustomer(id: number): Observable<Customer> {
    return this.http
      .get<Customer>(`${environment.apiUrl}/customers/${id}`)
      .pipe(catchError(this.handleError));
  }

  createCustomer(payload: CreateCustomer): Observable<Customer> {
    return this.http
      .post<Customer>(`${environment.apiUrl}/customers`, payload)
      .pipe(catchError(this.handleError));
  }

  updateCustomer(id: number, payload: UpdateCustomer): Observable<Customer> {
    return this.http
      .patch<Customer>(`${environment.apiUrl}/customers/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiUrl}/customers/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Equipment
  getEquipment(query: PaginationQuery & { status?: string; type?: string; search?: string } = {}): Observable<
    Paginated<Equipment>
  > {
    return this.http
      .get<Paginated<Equipment>>(`${environment.apiUrl}/equipment`, {
        params: this.toHttpParams(query),
      })
      .pipe(catchError(this.handleError));
  }

  getEquipmentById(id: number): Observable<Equipment> {
    return this.http
      .get<Equipment>(`${environment.apiUrl}/equipment/${id}`)
      .pipe(catchError(this.handleError));
  }

  createEquipment(payload: CreateEquipment): Observable<Equipment> {
    return this.http
      .post<Equipment>(`${environment.apiUrl}/equipment`, payload)
      .pipe(catchError(this.handleError));
  }

  updateEquipment(id: number, payload: UpdateEquipment): Observable<Equipment> {
    return this.http
      .patch<Equipment>(`${environment.apiUrl}/equipment/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  deleteEquipment(id: number): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiUrl}/equipment/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Jobs
  getJobs(
    query: PaginationQuery & {
      completed?: boolean;
      customerId?: number;
      startDate?: string;
      endDate?: string;
      workerId?: number;
      equipmentId?: number;
    } = {},
  ): Observable<Paginated<Job>> {
    return this.http
      .get<Paginated<Job>>(`${environment.apiUrl}/jobs`, {
        params: this.toHttpParams(query),
      })
      .pipe(catchError(this.handleError));
  }

  getJob(id: number): Observable<Job> {
    return this.http
      .get<Job>(`${environment.apiUrl}/jobs/${id}`)
      .pipe(catchError(this.handleError));
  }

  createJob(payload: CreateJob): Observable<Job> {
    return this.http
      .post<Job>(`${environment.apiUrl}/jobs`, payload)
      .pipe(catchError(this.handleError));
  }

  updateJob(id: number, payload: UpdateJob): Observable<Job> {
    return this.http
      .patch<Job>(`${environment.apiUrl}/jobs/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  deleteJob(id: number): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiUrl}/jobs/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Users
  getUsers(): Observable<User[]> {
    return this.http
      .get<User[]>(`${environment.apiUrl}/users`)
      .pipe(catchError(this.handleError));
  }

  getUser(id: number): Observable<User> {
    return this.http
      .get<User>(`${environment.apiUrl}/users/${id}`)
      .pipe(catchError(this.handleError));
  }

  createUser(payload: CreateUser): Observable<User> {
    return this.http
      .post<User>(`${environment.apiUrl}/users`, payload)
      .pipe(catchError(this.handleError));
  }

  updateUser(id: number, payload: UpdateUser): Observable<User> {
    return this.http
      .patch<User>(`${environment.apiUrl}/users/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: number): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiUrl}/users/${id}`)
      .pipe(catchError(this.handleError));
  }

  getMe(): Observable<User> {
    return this.http
      .get<User>(`${environment.apiUrl}/users/me`)
      .pipe(catchError(this.handleError));
  }

  updateMe(payload: UpdateUser): Observable<User> {
    return this.http
      .put<User>(`${environment.apiUrl}/users/me`, payload)
      .pipe(catchError(this.handleError));
  }

  // Companies
  getCompanyProfile(): Observable<Company> {
    return this.http
      .get<Company>(`${environment.apiUrl}/companies/profile`)
      .pipe(catchError(this.handleError));
  }

  getCompanyWorkers(): Observable<User[]> {
    return this.http
      .get<User[]>(`${environment.apiUrl}/companies/workers`)
      .pipe(catchError(this.handleError));
  }

  createCompany(payload: CreateCompany): Observable<Company> {
    return this.http
      .post<Company>(`${environment.apiUrl}/companies`, payload)
      .pipe(catchError(this.handleError));
  }

  updateCompany(id: number, payload: UpdateCompany): Observable<Company> {
    return this.http
      .patch<Company>(`${environment.apiUrl}/companies/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  getUpcomingJobs(): Observable<{ items: unknown[]; total: number }> {
    return this.http.get<{ items: unknown[]; total: number }>(
      `${environment.apiUrl}/jobs?completed=false&limit=5`
    );
  }

  getEquipmentCount(status: string): Observable<{ items: unknown[]; total: number }> {
    return this.http.get<{ items: unknown[]; total: number }>(
      `${environment.apiUrl}/equipment?status=${status}&limit=1`
    );
  }

}
